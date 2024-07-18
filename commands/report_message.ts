import {
	type APIMessageApplicationCommandGuildInteraction,
	ApplicationCommandType,
	MessageType,
	Utils,
} from "@discordjs/core";
import {
	deferReplyInteraction,
	fetchData,
	getRequiredEnv,
	isGuildChannel,
	replyInteraction,
} from "../utils/mod.ts";
import { messageLink, roleMention } from "@discordjs/formatters";
import { define } from "../utils/define.ts";

export default define.command({
	data: {
		name: "Report",
		type: ApplicationCommandType.Message,
	},
	execute(interaction) {
		if (
			isGuildChannel(interaction.channel) &&
			Utils.isApplicationCommandGuildInteraction(interaction)
		) {
			queueMicrotask(() => report(interaction));
			return deferReplyInteraction(true);
		} else {
			return replyInteraction({
				content: "This command can only initialized in a guild",
			});
		}
	},
});

async function report(
	interaction: APIMessageApplicationCommandGuildInteraction,
) {
	const api = define.api();

	const reportedMessage =
		interaction.data.resolved.messages[interaction.data.target_id];
	const reportedUser = reportedMessage.author;
	const reporter = interaction.member.user;

	if (reportedUser.bot || reportedMessage.type !== MessageType.Default) {
		return await api.interactions.editReply(
			interaction.application_id,
			interaction.token,
			{ content: "You can't report a system or bot message" },
		);
	} else {
		const fileDatas = await Promise.all(
			reportedMessage.attachments.map((attachment) =>
				fetchData(attachment.url)
			),
		);

		const postedReport = await api.webhooks.execute(
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
				thread_name:
					`A message report from ${interaction.channel.name}`,
				wait: true,
			},
		);

		const reportInfo = await api.channels.createMessage(
			postedReport.channel_id,
			{
				content: `${
					roleMention(getRequiredEnv("MODERATOR_ROLE"))
				}\n\nReported user: ${reportedMessage.author.username} (${reportedUser.id})\nReported by: ${reporter.username} (${reporter.id})\n\n${
					messageLink(
						reportedMessage.channel_id,
						reportedMessage.id,
					)
				}`,
			},
		);

		await api.channels.pinMessage(postedReport.channel_id, reportInfo.id);

		await api.interactions.editReply(
			interaction.application_id,
			interaction.token,
			{ content: `Your report has been silently sent to our moderators` },
		);
	}
}
