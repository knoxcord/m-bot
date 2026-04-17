import { channelMention, DMChannel, Guild, NonThreadGuildBasedChannel, TextChannel } from "discord.js";
import configuration from "../configuration/configuration.js";
import featureFlags from "../featureFlags/featureFlags.js";
import { ChannelOrderLogChannelIdConfigurationKey, ChannelOrderLoggingFeatureFlag } from "./config.js";

const DEBOUNCE_MS = 2000;

type ChannelChange = {
    channelId: string;
    channelName: string;
    oldPosition: number;
    newPosition: number;
    oldParentId: string | null;
    newParentId: string | null;
};

type PendingBatch = {
    timer: NodeJS.Timeout;
    guild: Guild;
    changes: Map<string, ChannelChange>;
};

const pendingBatches = new Map<string, PendingBatch>();

const isGuildChannel = (channel: DMChannel | NonThreadGuildBasedChannel): channel is NonThreadGuildBasedChannel =>
    'guild' in channel;

export const handleChannelOrderUpdate = (
    oldChannel: DMChannel | NonThreadGuildBasedChannel,
    newChannel: DMChannel | NonThreadGuildBasedChannel,
) => {
    if (!isGuildChannel(oldChannel) || !isGuildChannel(newChannel)) return;

    const guildId = newChannel.guild.id;
    if (!featureFlags.getFeatureFlag(guildId, ChannelOrderLoggingFeatureFlag)) return;

    const positionChanged = oldChannel.rawPosition !== newChannel.rawPosition;
    const parentChanged = oldChannel.parentId !== newChannel.parentId;
    if (!positionChanged && !parentChanged) return;

    let batch = pendingBatches.get(guildId);
    if (batch) {
        clearTimeout(batch.timer);
    } else {
        batch = {
            timer: null as unknown as NodeJS.Timeout,
            guild: newChannel.guild,
            changes: new Map(),
        };
        pendingBatches.set(guildId, batch);
    }

    const existing = batch.changes.get(newChannel.id);
    batch.changes.set(newChannel.id, {
        channelId: newChannel.id,
        channelName: newChannel.name,
        oldPosition: existing?.oldPosition ?? oldChannel.rawPosition,
        newPosition: newChannel.rawPosition,
        oldParentId: existing?.oldParentId ?? oldChannel.parentId,
        newParentId: newChannel.parentId,
    });

    batch.timer = setTimeout(
        () => flushBatch(guildId).catch(error => console.error("Error flushing channel order batch:", error)),
        DEBOUNCE_MS,
    );
};

const getCategoryName = (guild: Guild, parentId: string | null) => {
    if (!parentId) return 'no category';
    return guild.channels.cache.get(parentId)?.name ?? 'unknown category';
};

const flushBatch = async (guildId: string) => {
    const batch = pendingBatches.get(guildId);
    if (!batch) return;
    pendingBatches.delete(guildId);

    const realChanges = [...batch.changes.values()].filter(change =>
        change.oldPosition !== change.newPosition || change.oldParentId !== change.newParentId
    );
    if (realChanges.length === 0) return;

    const logChannelId = configuration.getConfigurationValue(guildId, ChannelOrderLogChannelIdConfigurationKey);
    if (!logChannelId) return;

    const logChannel = batch.guild.channels.cache.get(logChannelId) as TextChannel | undefined;
    if (!logChannel) return;

    const lines = realChanges.map(change => {
        const segments: string[] = [];
        if (change.oldParentId !== change.newParentId) {
            segments.push(
                `category **${getCategoryName(batch.guild, change.oldParentId)}** → **${getCategoryName(batch.guild, change.newParentId)}**`
            );
        }
        if (change.oldPosition !== change.newPosition) {
            segments.push(`position ${change.oldPosition} → ${change.newPosition}`);
        }
        return `• ${channelMention(change.channelId)} (\`${change.channelName}\`): ${segments.join(', ')}`;
    });

    await logChannel.send(
        `**Channel order changed** (${realChanges.length} channel${realChanges.length !== 1 ? 's' : ''}):\n${lines.join('\n')}`
    );
};
