import type { ModalSubmitInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import type { IModal } from "./modalTypes.ts";
import { ModalCustomIdPrefix } from "./modalTypes.ts";
import { AnonSubmitFieldId } from "../../features/topic/integrations/anonymousSubmit/types.ts";
import { buildAnonymousEmbed } from "../../features/topic/integrations/anonymousSubmit/builders.ts";
import { buildInaccessibleEmojiMessage, findInaccessibleCustomEmoji } from "../../features/topic/emojiValidation.ts";
import { createSubmission } from "../../features/submissionReview/submission.ts";
import { SubmissionType } from "../../features/submissionReview/types.ts";
import { TopicIntegrationType } from "../../features/topic/integrations/types.ts";
import { serializeTopicIntegrationSubmissionMetadata } from "../../features/topic/integrations/submissionReviewHandler.ts";

// Handles the anonymous submission modal. The submitter is recorded but never surfaced.
const handler = async (interaction: ModalSubmitInteraction) => {
    const content = interaction.fields.getTextInputValue(AnonSubmitFieldId.SubmissionText).trim();
    if (!content) {
        await interaction.reply({ content: "You didn't write anything.", flags: MessageFlags.Ephemeral });
        return;
    }

    // The bot reposts this text verbatim, so reject emoji it can't render (same as topics).
    const inaccessibleEmojiNames = findInaccessibleCustomEmoji(content, interaction.client);
    if (inaccessibleEmojiNames.length > 0) {
        await interaction.reply({ content: buildInaccessibleEmojiMessage(inaccessibleEmojiNames), flags: MessageFlags.Ephemeral });
        return;
    }

    const metadata = serializeTopicIntegrationSubmissionMetadata(TopicIntegrationType.AnonymousSubmit)
    const createdReviewMessageId = await createSubmission(SubmissionType.TopicIntegration, content, metadata, interaction, buildAnonymousEmbed);

    if (createdReviewMessageId) {
        await interaction.reply({
            content: "Thanks! Your submission has been sent to the mods for review.",
            flags: MessageFlags.Ephemeral,
        });
    }
};

export const TopicAnonResponse: IModal = {
    customIdPrefix: ModalCustomIdPrefix.AnonymousSubmit,
    handler,
};
