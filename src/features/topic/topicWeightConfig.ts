import configuration from "../configuration/configuration.ts";
import { PreloadedTopicsUserIdConfigurationKey, TopicWeightConfigurationKeys } from "./config.ts";
import { TopicWeightDefaults } from "./topicWeights.ts";
import type { WeightOptions } from "./topicWeights.ts";

const parseConfigFloat = (guildId: string, key: string, fallback: number) => {
    const raw = configuration.getConfigurationValue(guildId, key);
    if (!raw) return fallback;
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const resolveWeightOptions = (guildId: string): WeightOptions => ({
    preloadedUserId: configuration.getConfigurationValue(guildId, PreloadedTopicsUserIdConfigurationKey),
    config: {
        recencyCooldownHours: parseConfigFloat(guildId, TopicWeightConfigurationKeys.RecencyCooldownHours, TopicWeightDefaults.recencyCooldownHours),
        recencyWindowHours: parseConfigFloat(guildId, TopicWeightConfigurationKeys.RecencyWindowHours, TopicWeightDefaults.recencyWindowHours),
        recencyFloor: parseConfigFloat(guildId, TopicWeightConfigurationKeys.RecencyFloor, TopicWeightDefaults.recencyFloor),
        preloadedUserMultiplier: parseConfigFloat(guildId, TopicWeightConfigurationKeys.PreloadedUserMultiplier, TopicWeightDefaults.preloadedUserMultiplier),
        voteStep: parseConfigFloat(guildId, TopicWeightConfigurationKeys.VoteStep, TopicWeightDefaults.voteStep),
        voteFloor: parseConfigFloat(guildId, TopicWeightConfigurationKeys.VoteFloor, TopicWeightDefaults.voteFloor),
        voteCeiling: parseConfigFloat(guildId, TopicWeightConfigurationKeys.VoteCeiling, TopicWeightDefaults.voteCeiling),
    },
});
