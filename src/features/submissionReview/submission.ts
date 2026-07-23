import type { TextChannel, ModalSubmitInteraction, MessageCreateOptions, MessageComponentInteraction } from "discord.js";
import { EmbedBuilder, MessageFlags } from "discord.js";
import db from "../../database/db.ts"
import configuration from "../configuration/configuration.ts";
import { SubmissionReviewChannelIdConfigurationKey } from "../submissionReview/config.ts";
import type { SubmissionRow } from "../../database/types.ts";
import { SubmissionStatus, SubmissionReviewAction, type SubmissionType } from "./types.ts";
import { buildSubmitReviewButtonRow } from "./builders.ts";
import { handleSubmissionReview } from "./handlers.ts";

const submissionReviewActionStatusMap: Record<SubmissionReviewAction, SubmissionStatus> = {
    [SubmissionReviewAction.Accept]: SubmissionStatus.Accepted,
    [SubmissionReviewAction.Reject]: SubmissionStatus.Rejected
};

export const createSubmission = async (
    type: SubmissionType,
    content: string,
    metadata: string,
    interaction: ModalSubmitInteraction,
    embedBuilder: (submission: SubmissionRow) => EmbedBuilder
) => {
    if (!interaction.guildId || !interaction.channelId)
        return;

    const submissionId = db.createSubmission({
        guildId: interaction.guildId,
        submittedByUserId: interaction.user.id,
        sourceChannelId: interaction.channelId,
        sourceMessageId: interaction.message?.id ?? null,
        type: type,
        content: content,
        metadata: metadata,
    });

    const persistedSubmission = db.getSubmission(submissionId);
    if (!persistedSubmission) {
        await interaction.reply({ content: "Something went wrong saving your submission.", flags: MessageFlags.Ephemeral });
        return;
    }

    const reviewChannelId = configuration.getConfigurationValue(interaction.guildId, SubmissionReviewChannelIdConfigurationKey);
    const reviewChannel = reviewChannelId
        ? (interaction.guild?.channels.cache.get(reviewChannelId) as TextChannel | undefined)
        : undefined;
    if (!reviewChannel) {
        await interaction.reply({
            content: "Submissions aren't set up on this server yet — ask an admin to configure the review channel.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const reviewMessage = await reviewChannel.send(<MessageCreateOptions>{
        content: "New submission for review",
        embeds: [embedBuilder(persistedSubmission)],
        components: [buildSubmitReviewButtonRow(submissionId)],
    });
    db.setSubmissionReviewMessageId(submissionId, reviewMessage.id);
    return reviewMessage.id;
}

export const reviewSubmission = async (
    interaction: MessageComponentInteraction,
    submissionId: number,
    action: SubmissionReviewAction,
) => {
    if (!interaction.guildId || !interaction.channelId)
        return;

    const submission = db.getSubmission(submissionId);
    if (!submission) {
        await interaction.reply({ content: "Submission not found.", flags: MessageFlags.Ephemeral });
        return;
    }

    if (submission.Status !== SubmissionStatus.Pending) {
        await interaction.reply({ content: `This submission was already ${submission.Status}.`, flags: MessageFlags.Ephemeral });
        return;
    }

    const newSubmissionStatus = submissionReviewActionStatusMap[action];
    const dbResult = db.updateSubmissionStatus(submissionId, newSubmissionStatus, interaction.user.id);

    if (dbResult.changes < 1)
        return;

    const accepted = newSubmissionStatus === SubmissionStatus.Accepted;

    // Reuse the submission type's own card (whatever embed it built) and stamp the outcome onto it,
    // so this stays generic across submission types.
    const [existingEmbed] = interaction.message.embeds;
    const reviewedEmbed = EmbedBuilder.from(existingEmbed)
        .setColor(accepted ? 0x00AA00 : 0xAA0000)
        .addFields({ name: accepted ? "Approved by" : "Rejected by", value: `<@${interaction.user.id}>` });

    await interaction.update({
        content: accepted ? "✅ Approved" : "🛑 Rejected",
        embeds: [reviewedEmbed],
        components: [],
    });

    const updatedSubmission: SubmissionRow = { ...submission, Status: newSubmissionStatus };
    await handleSubmissionReview(updatedSubmission, interaction);
}
