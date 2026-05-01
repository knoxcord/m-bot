import db, { TopicRow } from "../../database/db.js";

class Topics {
    addTopic(guildId: string, topic: string, addedByUserId: string) {
        return db.addTopic(guildId, topic, addedByUserId);
    }

    getTopic(guildId: string, topicId: number) {
        return db.getTopic(guildId, topicId);
    }

    getRandomTopic(guildId: string): TopicRow | undefined {
        return db.getRandomTopic(guildId);
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
