import type { TextChannel, ModalSubmitInteraction, MessageCreateOptions, MessageComponentInteraction, AttachmentBuilder, EmbedAssetData, Embed } from "discord.js";
import { EmbedBuilder, MessageFlags } from "discord.js";
import db from "../../database/db.ts"
import configuration from "../configuration/configuration.ts";
import { SubmissionReviewChannelIdConfigurationKey } from "../submissionReview/config.ts";
import type { SubmissionRow } from "../../database/types.ts";
import { SubmissionStatus, SubmissionReviewAction, type SubmissionType } from "./types.ts";
import { buildSubmitReviewButtonRow } from "./builders.ts";
import { handleSubmissionReview } from "./handlers.ts";
import { extractAttachmentNameFromUrl } from "../../shared/urlHelpers.ts";

const submissionReviewActionStatusMap: Record<SubmissionReviewAction, SubmissionStatus> = {
    [SubmissionReviewAction.Accept]: SubmissionStatus.Accepted,
    [SubmissionReviewAction.Reject]: SubmissionStatus.Rejected
};

const DiscordAttachmentCdnUrlPrefix = 'https://cdn.discordapp.com/attachments/';

/** Submissions start either from a modal (topic integrations) or a button (news drafts). */
type SubmissionSourceInteraction = ModalSubmitInteraction | MessageComponentInteraction;

// Button-driven callers have usually already deferred by the time we get here, which rules out
// reply(). followUp covers both cases with the same ephemeral message.
const respondEphemerally = (interaction: SubmissionSourceInteraction, content: string) =>
    interaction.deferred || interaction.replied
        ? interaction.followUp({ content, flags: MessageFlags.Ephemeral })
        : interaction.reply({ content, flags: MessageFlags.Ephemeral });

const hasEmbeddedAttachment = (embed: Embed): embed is Embed & { image: EmbedAssetData } => 
        !!embed.image && embed.image.url.startsWith(DiscordAttachmentCdnUrlPrefix)

export const createSubmission = async (
    type: SubmissionType,
    content: string,
    metadata: string,
    interaction: SubmissionSourceInteraction,
    embedBuilder: (submission: SubmissionRow) => EmbedBuilder,
    files?: AttachmentBuilder[]
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
        await respondEphemerally(interaction, "Something went wrong saving your submission.");
        return;
    }

    const reviewChannelId = configuration.getConfigurationValue(interaction.guildId, SubmissionReviewChannelIdConfigurationKey);
    const reviewChannel = reviewChannelId
        ? (interaction.guild?.channels.cache.get(reviewChannelId) as TextChannel | undefined)
        : undefined;
    if (!reviewChannel) {
        await respondEphemerally(interaction, "Submissions aren't set up on this server yet — ask an admin to configure the review channel.");
        return;
    }

    const reviewMessage = await reviewChannel.send(<MessageCreateOptions>{
        content: "New submission for review",
        embeds: [embedBuilder(persistedSubmission)],
        components: [buildSubmitReviewButtonRow(submissionId)],
        files: files,
    });
    db.setSubmissionReviewMessageId(submissionId, reviewMessage.id);
    return submissionId;
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
    const dbResult = db.updateSubmissionStatus(submissionId, newSubmissionStatus, interaction.user.id, submission.Status);
    
    if (dbResult.changes < 1)
        return;

    const accepted = newSubmissionStatus === SubmissionStatus.Accepted;
    
    // Defer after db because db access is syncronous and could fail
    await interaction.deferUpdate();

    // Reuse the submission type's own card (whatever embed it built) and stamp the outcome onto it,
    //   so this stays generic across submission types.
    const [existingEmbed] = interaction.message.embeds;
    const reviewedEmbed = EmbedBuilder.from(existingEmbed)
        .setColor(accepted ? 0x00AA00 : 0xAA0000)
        .addFields({ name: accepted ? "Approved by" : "Rejected by", value: `<@${interaction.user.id}>` });

    // Embedded attachments created from blobs are consumed by discord and converted to files served
    //   from their CDN.
    // Reading the embed back resolves that reference to a CDN URL, and editing the embed with the
    //   resolved URL un-consumes the file. Discord then renders it in the main message content as well
    //   as in the embed, so the file appears twice.
    // To ensure the file stays intact in the embed and isn't duplicated, we have to extract the
    //   file's name from the URL and re-attach it to the embed.
    if (hasEmbeddedAttachment(existingEmbed)) {
        const extractedAttachmentName = extractAttachmentNameFromUrl(existingEmbed.image.url);
        if (extractedAttachmentName)
            reviewedEmbed.setImage(`attachment://${extractedAttachmentName}`);
    }

    await interaction.editReply({
        content: accepted ? "✅ Approved" : "🛑 Rejected",
        embeds: [reviewedEmbed],
        components: [],
        // Don't set `files` here or else the embed's attached files will be removed
    });

    const updatedSubmission: SubmissionRow = { ...submission, Status: newSubmissionStatus };
    await handleSubmissionReview(updatedSubmission, interaction);
}
