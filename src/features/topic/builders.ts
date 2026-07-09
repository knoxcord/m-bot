import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, LabelBuilder, ModalBuilder, TextDisplayBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import type { TopicWithVotesRow } from "../../database/db.ts";
import { TopicVote } from "../../database/db.ts";
import { TopicEditFieldId, TopicManageAction, TopicManageCustomIdKey, TopicVoteCustomIdKey } from "./types.ts";
import { ModalCustomIdPrefix } from "../../handlers/modals/modalTypes.ts";
import { computeWeightBreakdown } from "./topicWeights.ts";
import { resolveWeightOptions } from "./topicWeightConfig.ts";

export const buildTopicVoteRow = (topicId: number, upvotes: number, downvotes: number) =>
    new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setCustomId(`${TopicVoteCustomIdKey}:${TopicVote.Up}:${topicId}`)
            .setLabel(`👍 Good Topic: ${upvotes}`)
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`${TopicVoteCustomIdKey}:${TopicVote.Down}:${topicId}`)
            .setLabel(`👎 Bad Topic: ${downvotes}`)
            .setStyle(ButtonStyle.Secondary),
    );

export const buildTopicMessage = (topic: TopicWithVotesRow) => ({
    content: topic.Topic,
    // Topic text is user-submitted, so never let it ping anyone (users, roles, @everyone/@here).
    allowedMentions: { parse: [] },
    components: [buildTopicVoteRow(topic.Id, topic.Upvotes, topic.Downvotes)],
});

export const buildTopicManageButtonRow = (topicId: number) =>
    new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setCustomId(`${TopicManageCustomIdKey}:${TopicManageAction.Edit}:${topicId}`)
            .setLabel("✏️ Edit")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`${TopicManageCustomIdKey}:${TopicManageAction.Delete}:${topicId}`)
            .setLabel("🗑️ Delete")
            .setStyle(ButtonStyle.Secondary),
    );

export const buildTopicDeleteConfirmRow = (topicId: number) =>
    new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setCustomId(`${TopicManageCustomIdKey}:${TopicManageAction.CancelDelete}:${topicId}`)
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`${TopicManageCustomIdKey}:${TopicManageAction.ConfirmDelete}:${topicId}`)
            .setLabel("Yes, delete it")
            .setStyle(ButtonStyle.Danger),
    );

export const buildTopicInfoEmbed = (topic: TopicWithVotesRow, guildId: string) => {
    const embed = new EmbedBuilder()
        .setTitle(`Topic ID: ${topic.Id}`);

    embed.addFields({ name: "Topic text", value: topic.Topic });
    embed.addFields({ name: "Added by", value: `<@${topic.AddedByUserId}>`, inline: true });
    embed.addFields({ name: "Created date", value: `<t:${Math.floor(new Date(`${topic.CreatedAt}Z`).getTime() / 1000)}:f>`, inline: true });
    embed.addFields({
        name: "Last shown",
        value: topic.LastShownAt
            ? `<t:${Math.floor(new Date(`${topic.LastShownAt}Z`).getTime() / 1000)}:R>`
            : "never",
        inline: true,
    });
    embed.addFields({ name: "Times shown", value: `${topic.ShownCount}`, inline: true });
    embed.addFields({ name: "Upvotes", value: `${topic.Upvotes}`, inline: true });
    embed.addFields({ name: "Downvotes", value: `${topic.Downvotes}`, inline: true });

    embed.addFields({ name: "​", value: "─────────────────────────────" });

    const breakdown = computeWeightBreakdown(topic, resolveWeightOptions(guildId));
    embed.addFields({ name: "Recency multiplier", value: breakdown.recency.toFixed(3), inline: true });
    embed.addFields({ name: "Author multiplier", value: breakdown.author.toFixed(3), inline: true });
    embed.addFields({ name: "Vote multiplier", value: breakdown.vote.toFixed(3), inline: true });
    embed.addFields({ name: "Calculated weight", value: breakdown.total.toFixed(3), inline: true });

    return embed;
};

const TopicTextHelpText = "You can use [markdown formatting](https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline) in the topic. To display emoji or mentions (channel, role, user, etc), use [escaped syntax](https://c.r74n.com/discord/formatting#EscapeMentions). Topic text never pings anyone.";

const buildTopicTextHelp = () => new TextDisplayBuilder().setContent(TopicTextHelpText);

export const buildTopicAddModal = () => {
    const topicTextInput = new TextInputBuilder()
        .setCustomId(TopicEditFieldId.TopicText)
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(2000);
    const topicTextComponent = new LabelBuilder()
        .setLabel("Topic text")
        .setTextInputComponent(topicTextInput);
    return new ModalBuilder()
        .setCustomId(ModalCustomIdPrefix.TopicAdd)
        .setTitle("Add Topic")
        .addTextDisplayComponents(buildTopicTextHelp())
        .addLabelComponents(topicTextComponent);
};

export const buildTopicEditModal = (topicId: number, currentText: string) => {
    const topicTextInput = new TextInputBuilder()
        .setCustomId(TopicEditFieldId.TopicText)
        .setStyle(TextInputStyle.Paragraph)
        .setValue(currentText)
        .setRequired(true)
        .setMaxLength(2000);
    const topicTextComponent = new LabelBuilder()
        .setLabel("Topic text")
        .setTextInputComponent(topicTextInput);
    return new ModalBuilder()
        .setCustomId(`${ModalCustomIdPrefix.TopicEdit}:${topicId}`)
        .setTitle("Edit Topic")
        .addTextDisplayComponents(buildTopicTextHelp())
        .addLabelComponents(topicTextComponent);
};
