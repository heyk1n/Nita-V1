import { STATUS_CODE } from "@std/http/status";
import tweetnacl from "tweetnacl";
import { decodeHex } from "@std/encoding/hex";
import {
	type APIInteraction,
	ApplicationCommandType,
	InteractionType,
	MessageFlags,
} from "@discordjs/core";
import manifest from "./manifest.gen.ts";
import * as utils from "./utils.ts";

async function handler(request: Request) {
	const unauthorized = new Response("Invalid request", {
		status: STATUS_CODE.Unauthorized,
	});

	if (request.method === "POST") {
		const body = await request.text();
		const timestamp = utils.getRequiredHeader(
			request.headers,
			"x-signature-timestamp",
		);
		const signature = utils.getRequiredHeader(
			request.headers,
			"x-signature-ed25519",
		);
		const publicKey = utils.getRequiredEnv("PUBLIC_KEY");

		const valid = tweetnacl.sign.detached.verify(
			new TextEncoder().encode(timestamp + body),
			decodeHex(signature),
			decodeHex(publicKey),
		);

		if (valid) {
			const token = utils.getRequiredEnv("TOKEN");

			if (token) {
				const interaction: APIInteraction = JSON.parse(body);

				switch (interaction.type) {
					case InteractionType.Ping: {
						await utils.defineApi().applicationCommands
							.bulkOverwriteGlobalCommands(
								interaction.application_id,
								manifest.commands.map((ctx) => ctx.data),
							);
						return utils.pongInteractionResponse;
					}
					case InteractionType.ApplicationCommand: {
						const commandName = interaction.data.name;
						const commandNotFound = utils.replyInteraction({
							content: "command not found.",
							flags: MessageFlags.Ephemeral,
						});
						const unknownCommandType = utils.replyInteraction({
							content: "unknown command type.",
							flags: MessageFlags.Ephemeral,
						});

						if (utils.isChatInputInteraction(interaction)) {
							const command = utils.findCommand(
								commandName,
								ApplicationCommandType.ChatInput,
							);
							return command
								? await command.execute(interaction)
								: commandNotFound;
						} else if (
							utils.isMessageContextMenuInteraction(
								interaction,
							)
						) {
							const command = utils.findCommand(
								commandName,
								ApplicationCommandType.Message,
							);
							return command
								? await command.execute(interaction)
								: commandNotFound;
						} else if (
							utils.isUserContextMenuInteraction(interaction)
						) {
							const command = utils.findCommand(
								commandName,
								ApplicationCommandType.User,
							);
							return command
								? await command.execute(interaction)
								: commandNotFound;
						} else {
							return unknownCommandType;
						}
					}
					case InteractionType.MessageComponent:
					case InteractionType.ApplicationCommandAutocomplete:
					case InteractionType.ModalSubmit: {
						return utils.replyInteraction({
							content: "not implemented, yet.",
							flags: MessageFlags.Ephemeral,
						});
					}
				}
			} else {
				throw new Error("No token provided");
			}
		} else {
			return unauthorized;
		}
	} else {
		return unauthorized;
	}
}

Deno.serve(handler);
