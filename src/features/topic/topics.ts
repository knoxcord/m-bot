import db from "../../database/db.ts";
import type { TopicRow, TopicVote, TopicWithVotesRow } from "../../database/types.ts";
import type { TopicIntegrationKey } from "./types.ts";
import { pickWeighted } from "./topicWeights.ts";
import { resolveWeightOptions } from "./topicWeightConfig.ts";

class Topics {
    addTopic(guildId: string, topic: string, addedByUserId: string, integrationKey: TopicIntegrationKey | null = null) {
        return db.addTopic(guildId, topic, addedByUserId, integrationKey);
    }

    setTopicIntegration(guildId: string, id: number, integrationKey: TopicIntegrationKey | null) {
        return db.setTopicIntegration(guildId, id, integrationKey);
    }

    getTopic(guildId: string, topicId: number) {
        return db.getTopic(guildId, topicId);
    }

    getWeightedRandomTopic(guildId: string): TopicWithVotesRow | undefined {
        const candidates = db.getTopicsForWeighting(guildId);
        const picked = pickWeighted(candidates, resolveWeightOptions(guildId));
        if (!picked) return undefined;

        return db.markTopicShownAndReturn(guildId, picked.Id);
    }

    recordVote(topicId: number, userId: string, direction: TopicVote) {
        return db.applyTopicVote(topicId, userId, direction);
    }

    searchTopics(guildId: string, query: string): TopicRow[] {
        if (!query) return db.getRecentTopics(guildId);
        return db.searchTopics(guildId, query);
    }

    removeTopic(guildId: string, id: number) {
        return db.removeTopic(guildId, id);
    }

    updateTopicText(guildId: string, id: number, topic: string) {
        return db.updateTopicText(guildId, id, topic);
    }

    resetTopicLastShown(guildId: string, id: number) {
        return db.resetTopicLastShownAndReturn(guildId, id);
    }

    /** Marks a specific topic shown (bumps count + last-shown) and returns it ready to post. */
    markTopicShown(guildId: string, id: number) {
        return db.markTopicShownAndReturn(guildId, id);
    }
};

export default new Topics();
