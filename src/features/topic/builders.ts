import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { TopicWithVotesRow } from "../../database/db.ts";
import { TopicVote } from "../../database/db.ts";
import { TopicVoteCustomIdKey } from "./types.ts";

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
