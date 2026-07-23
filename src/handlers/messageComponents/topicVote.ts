import type { MessageComponentInteraction } from "discord.js";
import type { IMessageComponent } from "./messageComponentTypes.ts";
import { MessageComponentCustomIdPrefix } from "./messageComponentTypes.ts";
import { TopicVote } from "../../database/types.ts";
import topics from "../../features/topic/topics.ts";
import { buildTopicVoteRow } from "../../features/topic/builders.ts";

const handler = async (interaction: MessageComponentInteraction) => {
    const [, directionRaw, topicIdRaw] = interaction.customId.split(":");
    const direction = Number(directionRaw) as TopicVote;
    const topicId = Number(topicIdRaw);

    if (direction !== TopicVote.Up && direction !== TopicVote.Down) {
        console.warn(`Invalid topic vote direction: ${directionRaw}`);
        return;
    }
    if (!Number.isFinite(topicId)) {
        console.warn(`Invalid topic vote id: ${topicIdRaw}`);
        return;
    }

    const counts = topics.recordVote(topicId, interaction.user.id, direction);

    await interaction.update({
        components: [buildTopicVoteRow(topicId, counts.Upvotes, counts.Downvotes)],
    });
};

export const TopicVoteComponent: IMessageComponent = {
    customIdPrefix: MessageComponentCustomIdPrefix.TopicVote,
    handler: handler,
};
