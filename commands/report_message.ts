import {
	type API,
	type APIMessageApplicationCommandGuildInteraction,
	ApplicationCommandType,
	Utils,
} from "@discordjs/core";
import { type MessageContextMenuCommand } from "../types.d.ts";
import {
	api,
	deferReplyInteraction,
	fetchData,
	getRequiredEnv,
	replyInteraction,
} from "../utils.ts";
import { messageLink, roleMention } from "@discordjs/formatters";

export default {
	data: {
		name: "Report",
		type: ApplicationCommandType.Message,
	},
	execute(interaction) {
		if (Utils.isApplicationCommandGuildInteraction(interaction)) {
			queueMicrotask(() => report(api, interaction));
			return deferReplyInteraction(true);
		} else {
			return replyInteraction({
				content: "this command can only initialized in a guild",
			});
		}
	},
} satisfies MessageContextMenuCommand;

async function report(
	api: API,
	interaction: APIMessageApplicationCommandGuildInteraction,
) {
	const reportedMessage =
		interaction.data.resolved.messages[interaction.data.target_id];
	const reportedUser = reportedMessage.author;
	const reporter = interaction.member.user;

	if (reportedUser.bot) {
		return await api.interactions.editReply(
			interaction.application_id,
			interaction.token,
			{ content: "You can't report a message from bots" },
		);
	} else {
		const thread = await api.channels.createForumThread(
			getRequiredEnv("REPORT_CHANNEL"),
			{
				name: `A message report from ${
					interaction.channel.name ?? "unknown channel"
				}`,
				message: {
					content: `${
						roleMention(getRequiredEnv("MODERATOR_ROLE"))
					}\n\nReported user: ${reportedMessage.author.username} (${reportedUser.id})\nReported by: ${reporter.username} (${reporter.id})\n\n${
						messageLink(
							reportedMessage.channel_id,
							reportedMessage.id,
						)
					}`,
				},
			},
		);

		const fileDatas = await Promise.all(
			reportedMessage.attachments.map((attachment) =>
				fetchData(attachment.url)
			),
		);

		await api.webhooks.execute(
			getRequiredEnv("REPORT_WEBHOOK_ID"),
			getRequiredEnv("REPORT_WEBHOOK_TOKEN"),
			{
				avatar_url: reportedUser.avatar
					? api.rest.cdn.avatar(reportedUser.id, reportedUser.avatar)
					: undefined,
				username: reportedUser.username,
				allowed_mentions: {},
				content: reportedMessage.content,
				files: reportedMessage.attachments.map((attachment, index) => ({
					name: attachment.filename,
					data: fileDatas[index],
				})),
				thread_id: thread.id,
				wait: true,
			},
		);

		await api.interactions.editReply(
			interaction.application_id,
			interaction.token,
			{ content: `Your report has been silently sent to our moderators` },
		);
	}
}
