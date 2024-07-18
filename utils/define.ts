import type {
	ChatInputCommand,
	Command,
	MessageContextMenuCommand,
	UserContextMenuCommand,
} from "../types.d.ts";

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

export const define = { command };
