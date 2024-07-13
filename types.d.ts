import {
	type APIApplicationCommandInteraction,
	type APIChatInputApplicationCommandInteraction,
	type APIMessageApplicationCommandInteraction,
	type APIUserApplicationCommandInteraction,
	type ApplicationCommandType,
	type RESTPostAPIApplicationCommandsJSONBody,
	type RESTPostAPIChatInputApplicationCommandsJSONBody,
	type RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from "@discordjs/core";

export interface Manifest {
	commands: Command[];
}

type ChatInputCommand = BaseCommand<
	RESTPostAPIChatInputApplicationCommandsJSONBody & {
		type: ApplicationCommandType.ChatInput;
	},
	APIChatInputApplicationCommandInteraction
>;
type MessageContextMenuCommand = BaseCommand<
	Omit<RESTPostAPIContextMenuApplicationCommandsJSONBody, "type"> & {
		type: ApplicationCommandType.Message;
	},
	APIMessageApplicationCommandInteraction
>;
type UserContextMenuCommand = BaseCommand<
	Omit<RESTPostAPIContextMenuApplicationCommandsJSONBody, "type"> & {
		type: ApplicationCommandType.User;
	},
	APIUserApplicationCommandInteraction
>;

export type Command =
	| ChatInputCommand
	| MessageContextMenuCommand
	| UserContextMenuCommand;

interface BaseCommand<
	Data extends RESTPostAPIApplicationCommandsJSONBody,
	Interaction extends APIApplicationCommandInteraction,
> {
	data: Data;
	execute(
		interaction: Interaction,
	): Promise<Response> | Response;
}
