import {
    EmbedBuilder,
    LabelBuilder,
    ModalBuilder,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import type { SubmissionRow } from "../../../../database/types.ts";
import {
    AnonSubmitFieldId,
    AnonSubmitModalKey,
} from "./types.ts";
import { getMessageLink } from "../../../../shared/urlHelpers.ts";

const AnonymousSubmitNote = "Your submission is **anonymous**: your name is never shown publicly. Note, however, that the bot owner can trace who submitted it if it's reported for abuse.";

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
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(AnonymousSubmitNote))
        .addLabelComponents(textComponent);
};

export const buildAnonymousEmbed = (submission: SubmissionRow) =>
    new EmbedBuilder()
        // The submitter is deliberately not shown — anonymity is the whole point.
        .setTitle("🕵️ Anonymous submission")
        .setDescription(submission.Content)
        .setColor(0xBBBB00)
        .addFields({ name: "In reply to", value: getMessageLink(submission.GuildId, submission.SourceChannelId, submission.SourceMessageId ?? ""), inline: true })
        .setFooter({ text: `Submission #${submission.Id}` });
