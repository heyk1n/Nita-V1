import type {
	ChatInputCommand,
	Command,
	MessageContextMenuCommand,
	UserContextMenuCommand,
} from "../types.d.ts";
import { API } from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { getRequiredEnv } from "./mod.ts";

function api() {
	return new API(new REST().setToken(getRequiredEnv("TOKEN")));
}

function command(command: ChatInputCommand): ChatInputCommand;
function command(command: MessageContextMenuCommand): MessageContextMenuCommand;
function command(command: UserContextMenuCommand): UserContextMenuCommand;
function command(command: Command): Command {
	if (!command.data || !command.execute) {
		throw new Error('Property "data" or "execute" is missing.');
	} else {
		return command;
	}
}

export const define = { api, command };
