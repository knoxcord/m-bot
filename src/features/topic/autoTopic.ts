import type { Guild, Message, OmitPartialGroupDMChannel } from "discord.js";
import configuration from "../configuration/configuration.ts";
import featureFlags from "../featureFlags/featureFlags.ts";
import topics from "./topics.ts";
import { buildTopicMessage } from "./builders.ts";
import {
    AutoTopicChannelIdConfigurationKey,
    AutoTopicFeatureFlag,
    AutoTopicInactivityMinutesConfigurationKey,
    TopicsFeatureFlag,
} from "./config.ts";

// Prevent spamming due to bad config
const MINIMUM_AUTO_TOPIC_INACTIVITY_MINUTES = 1;

type GuildTimerEntry = {
    timeoutId: NodeJS.Timeout;
};

const guildTimers = new Map<string, GuildTimerEntry>();

const clearGuildTimer = (guildId: string) => {
    const existing = guildTimers.get(guildId);
    if (existing) {
        clearTimeout(existing.timeoutId);
        guildTimers.delete(guildId);
    }
};

const resolveInactivityMs = (guildId: string): number | undefined => {
    const raw = configuration.getConfigurationValue(guildId, AutoTopicInactivityMinutesConfigurationKey);
    if (!raw) return undefined;
    const minutes = Number(raw);
    if (!Number.isFinite(minutes) || minutes < MINIMUM_AUTO_TOPIC_INACTIVITY_MINUTES) {
        console.warn(`Found invalid ${AutoTopicInactivityMinutesConfigurationKey} setting for guildId ${guildId}: ${raw}`);
        return undefined;
    }
    return minutes * 60 * 1000;
};

const postAutoTopic = async (guild: Guild) => {
    const guildId = guild.id;

    if (!featureFlags.getFeatureFlag(guildId, TopicsFeatureFlag)) return;
    if (!featureFlags.getFeatureFlag(guildId, AutoTopicFeatureFlag)) return;

    const channelId = configuration.getConfigurationValue(guildId, AutoTopicChannelIdConfigurationKey);
    if (!channelId) return;

    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased() || !('send' in channel)) {
        console.warn(`Auto topic: channel ${channelId} for guild ${guildId} is missing or not text-based`);
        return;
    }

    const topic = topics.getWeightedRandomTopic(guildId);
    if (!topic) return;
    await channel.send(buildTopicMessage(topic));
};

export const handleAutoTopicMessage = (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    if (!message.guildId || !message.guild) return;

    const guildId = message.guildId;
    const guild = message.guild;

    clearGuildTimer(guildId);

    if (!featureFlags.getFeatureFlag(guildId, AutoTopicFeatureFlag)) return;

    const inactivityMs = resolveInactivityMs(guildId);
    if (inactivityMs === undefined) return;

    const timeoutId = setTimeout(() => {
        guildTimers.delete(guildId);
        postAutoTopic(guild).catch(error =>
            console.error(`Error posting auto topic for guild ${guildId}:`, error)
        );
    }, inactivityMs);

    guildTimers.set(guildId, { timeoutId });
};
