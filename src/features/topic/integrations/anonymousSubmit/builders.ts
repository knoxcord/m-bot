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
import type { AnonymousIdentity } from "./anonymousIdentity.ts";
import { deriveAnonymousIdentity } from "./anonymousIdentity.ts";

const AnonymousSubmitNote = "Your submission is **anonymous**: your real name will not be shown anywhere. Note, however, that the bot owner can trace who submitted it if it's reported for abuse.";

// Keep the topic-text context block short so it doesn't push the input off-screen in the modal.
const TopicContextMaxLength = 500;

const buildTopicContext = (topicText: string) => {
    const trimmed = topicText.length > TopicContextMaxLength
        ? `${topicText.slice(0, TopicContextMaxLength)}…`
        : topicText;
    // Render as a blockquote so it reads as the topic being replied to, distinct from the note.
    const quoted = trimmed.split("\n").map(line => `> ${line}`).join("\n");
    return new TextDisplayBuilder().setContent(`**Replying to:**\n${quoted}`);
};

export const buildAnonymousSubmitModal = (topicText: string, codename: string) => {
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
        .addTextDisplayComponents(buildTopicContext(topicText))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`You'll appear as **${codename}**.`))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(AnonymousSubmitNote))
        .addLabelComponents(textComponent);
};

export const buildAnonymousSubmissionReviewEmbed = (submission: SubmissionRow, content: string) => {
    // The submitter is deliberately not shown — anonymity is the whole point. The codename (and
    // its sprite) match the public reply, so mods can spot repeat anons within a topic.
    const { codename, spriteUrl } = deriveAnonymousIdentity(submission);
    return new EmbedBuilder()
        .setAuthor({ name: codename, iconURL: spriteUrl })
        .setDescription(content)
        .setColor(0xBBBB00)
        .addFields({ name: "In reply to", value: getMessageLink(submission.GuildId, submission.SourceChannelId, submission.SourceMessageId ?? ""), inline: true })
};

export const buildAnonymousReplyEmbedFromSubmission = (submission: SubmissionRow, content: string) => {
    const identity = deriveAnonymousIdentity(submission);
    return buildAnonymousReplyEmbed(identity, content);
};

// Ephemeral preview shown to the submitter after they submit: their persona (codename + sprite +
// color) alongside their message, so they can see how the reply will appear if it's approved.
export const buildAnonymousReplyEmbed = (identity: AnonymousIdentity, content: string) =>
    new EmbedBuilder()
        .setAuthor({ name: identity.codename, iconURL: identity.spriteUrl })
        .setDescription(content)
        .setColor(identity.color);
