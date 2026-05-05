import db from "../../database/db.ts";
import type { TopicRow } from "../../database/db.ts";
import featureFlags from "../featureFlags/featureFlags.ts";
import { TopicWeightedSelectionFeatureFlag } from "./config.ts";
import { pickWeighted } from "./topicWeights.ts";
import { resolveWeightOptions } from "./topicWeightConfig.ts";

class Topics {
    addTopic(guildId: string, topic: string, addedByUserId: string) {
        return db.addTopic(guildId, topic, addedByUserId);
    }

    getTopic(guildId: string, topicId: number) {
        return db.getTopic(guildId, topicId);
    }

    getRandomTopic(guildId: string): TopicRow | undefined {
        if (!featureFlags.getFeatureFlag(guildId, TopicWeightedSelectionFeatureFlag)) {
            return db.pickRandomTopicAndMarkShown(guildId);
        }

        const candidates = db.getTopicsForWeighting(guildId);
        const picked = pickWeighted(candidates, resolveWeightOptions(guildId));
        if (!picked) return undefined;

        return db.markTopicShownAndReturn(guildId, picked.Id);
    }

    searchTopics(guildId: string, query: string): TopicRow[] {
        if (!query) return db.getRecentTopics(guildId);
        return db.searchTopics(guildId, query);
    }

    removeTopic(guildId: string, id: number) {
        return db.removeTopic(guildId, id);
    }
};

export default new Topics();
