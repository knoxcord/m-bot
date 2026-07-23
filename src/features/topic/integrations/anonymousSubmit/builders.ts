import {
    EmbedBuilder,
    LabelBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import type { SubmissionRow } from "../../../../database/types.ts";
import {
    AnonSubmitFieldId,
    AnonSubmitModalKey,
} from "./types.ts";

// Builders for the anonymous-submission topic integration. Concrete on purpose — nothing
// here is meant to be reused by other integrations.

export const buildAnonymousSubmitModal = () => {
    const textInput = new TextInputBuilder()
        .setCustomId(AnonSubmitFieldId.SubmissionText)
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(2000);
    const textComponent = new LabelBuilder()
        .setLabel("Your message")
        .setTextInputComponent(textInput);
    return new ModalBuilder()
        .setCustomId(AnonSubmitModalKey)
        .setTitle("Anonymous Submission")
        .addLabelComponents(textComponent);
};

export const buildAnonymousEmbed = (submission: SubmissionRow) =>
    new EmbedBuilder()
        // The submitter is deliberately not shown — anonymity is the whole point.
        .setTitle("🕵️ Anonymous submission — pending review")
        .setDescription(submission.Content)
        .setColor(0xBBBB00)
        .addFields({ name: "Would post to", value: `<#${submission.SourceChannelId}>`, inline: true })
        .setFooter({ text: `Submission #${submission.Id}` });
