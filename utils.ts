import {
	API,
	type APIApplicationCommandInteraction,
	type APIChatInputApplicationCommandInteraction,
	type APIInteractionResponseCallbackData,
	type APIInteractionResponseDeferredChannelMessageWithSource,
	type APIMessageApplicationCommandInteraction,
	type APIUserApplicationCommandInteraction,
	ApplicationCommandType,
	InteractionResponseType,
	MessageFlags,
} from "@discordjs/core";
import {
	type ChatInputCommand,
	type Command,
	type MessageContextMenuCommand,
	type UserContextMenuCommand,
} from "./types.d.ts";
import manifestGen from "./manifest.gen.ts";
import { REST } from "@discordjs/rest";

export const api = new API(new REST().setToken(getRequiredEnv("TOKEN")));

export async function fetchData(url: URL | string) {
	const response = await fetch(url);
	return await response.bytes();
}

export function getRequiredHeader(headers: Headers, name: string): string {
	const value = headers.get(name);

	if (!value) {
		throw new Error(`Header not found: ${name}`);
	} else {
		return value;
	}
}
export function getRequiredEnv(name: string): string {
	const value = Deno.env.get(name);

	if (!value) {
		throw new Error(`Env variable not found: ${name}`);
	} else {
		return value;
	}
}

export function findCommand(
	name: string,
	type: ApplicationCommandType.ChatInput,
): ChatInputCommand | undefined;
export function findCommand(
	name: string,
	type: ApplicationCommandType.Message,
): MessageContextMenuCommand | undefined;
export function findCommand(
	name: string,
	type: ApplicationCommandType.User,
): UserContextMenuCommand | undefined;
export function findCommand(
	name: string,
	type: ApplicationCommandType,
): Command | undefined {
	return manifestGen.commands.find((ctx) =>
		ctx.data.name === name && ctx.data.type === type
	);
}

export function isChatInputInteraction(
	interaction: APIApplicationCommandInteraction,
): interaction is APIChatInputApplicationCommandInteraction {
	return interaction.data.type === ApplicationCommandType.ChatInput;
}
export function isMessageContextMenuInteraction(
	interaction: APIApplicationCommandInteraction,
): interaction is APIMessageApplicationCommandInteraction {
	return interaction.data.type === ApplicationCommandType.Message;
}
export function isUserContextMenuInteraction(
	interaction: APIApplicationCommandInteraction,
): interaction is APIUserApplicationCommandInteraction {
	return interaction.data.type === ApplicationCommandType.User;
}

export function deferReplyInteraction(ephemeral: boolean = false) {
	return Response.json(
		{
			type: InteractionResponseType.DeferredChannelMessageWithSource,
			data: { flags: ephemeral ? MessageFlags.Ephemeral : undefined },
		} satisfies APIInteractionResponseDeferredChannelMessageWithSource,
	);
}
export function replyInteraction(
	data: APIInteractionResponseCallbackData,
): Response {
	return Response.json({
		type: InteractionResponseType.ChannelMessageWithSource,
		data,
	});
}
