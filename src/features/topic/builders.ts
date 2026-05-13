import { ActionRowBuilder, ButtonBuilder, ButtonStyle, LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import type { TopicWithVotesRow } from "../../database/db.ts";
import { TopicVote } from "../../database/db.ts";
import { TopicEditFieldId, TopicVoteCustomIdKey } from "./types.ts";
import { ModalCustomIdPrefix } from "../../handlers/modals/modalTypes.ts";

export const buildTopicVoteRow = (topicId: number, upvotes: number, downvotes: number) =>
    new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setCustomId(`${TopicVoteCustomIdKey}:${TopicVote.Up}:${topicId}`)
            .setLabel(`👍 ${upvotes}`)
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`${TopicVoteCustomIdKey}:${TopicVote.Down}:${topicId}`)
            .setLabel(`👎 ${downvotes}`)
            .setStyle(ButtonStyle.Secondary),
    );

export const buildTopicMessage = (topic: TopicWithVotesRow) => ({
    content: topic.Topic,
    components: [buildTopicVoteRow(topic.Id, topic.Upvotes, topic.Downvotes)],
});

export const buildTopicEditModal = (topicId: number, currentText: string) => {
    const topicTextInput = new TextInputBuilder()
        .setCustomId(TopicEditFieldId.TopicText)
        .setStyle(TextInputStyle.Paragraph)
        .setValue(currentText)
        .setRequired(true)
        .setMaxLength(2000);
    const label = new LabelBuilder()
        .setLabel("Topic text")
        .setTextInputComponent(topicTextInput);
    return new ModalBuilder()
        .setCustomId(`${ModalCustomIdPrefix.TopicEdit}:${topicId}`)
        .setTitle("Edit Topic")
        .addLabelComponents(label);
};
