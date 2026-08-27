import type { BaseInteraction, GuildForumTag } from "discord.js";
import { ChannelFlags, ChannelType } from "discord.js";
import configuration from "../configuration/configuration.ts";
import { CommunityNewsChannelIdConfigurationKey, CommunityNewsLockingTagsConfigurationKey } from "./config.ts";

/**
 * Resolves the channel approved letters get posted to, or null when it isn't configured, isn't
 * visible, or is a kind of channel letters can't be posted to.
 */
export const getCommunityNewsChannel = (interaction: BaseInteraction) => {
    if (!interaction.guildId)
        return null;

    const channelId = configuration.getConfigurationValue(interaction.guildId, CommunityNewsChannelIdConfigurationKey);
    if (!channelId)
        return null;

    const channel = interaction.guild?.channels.cache.get(channelId);
    if (!channel)
        return null;

    // Forum channels take a different posting call than text channels, so both kinds resolve here
    //   and are differentiated in postNews.
    if (channel.type === ChannelType.GuildForum)
        return channel;

    return channel.isTextBased() && channel.isSendable() ? channel : null;
}

export type CommunityNewsChannel = NonNullable<ReturnType<typeof getCommunityNewsChannel>>;

/** What the news forum lets an author choose from. Null when news doesn't post to a forum. */
export interface CommunityNewsTagPicker {
    /** Tags an author may apply. Empty when the forum has no tags, or only moderated ones. */
    tags: GuildForumTag[];
    /** Whether the forum refuses posts that carry no tag. */
    required: boolean;
}

export const getCommunityNewsTagPicker = (interaction: BaseInteraction): CommunityNewsTagPicker | null => {
    const channel = getCommunityNewsChannel(interaction);
    if (channel?.type !== ChannelType.GuildForum)
        return null;

    return {
        // Moderated tags are mod-only by the forum's own rules. The bot is the one applying them,
        //   so offering them to an author would hand out the tag the server meant to withhold.
        tags: channel.availableTags.filter(tag => !tag.moderated),
        required: channel.flags.has(ChannelFlags.RequireTag),
    };
}

/**
 * Matches a tag against the guild's configured lock list, which admins fill in with tag names since
 * that is all Discord's UI exposes. Renaming a tag therefore stops it locking.
 */
export const isLockingTag = (guildId: string, tag: GuildForumTag) => {
    const configured = configuration.getConfigurationValue(guildId, CommunityNewsLockingTagsConfigurationKey);
    if (!configured)
        return false;

    return configured
        .split(",")
        .map(name => name.trim().toLowerCase())
        .filter(Boolean)
        .includes(tag.name.toLowerCase());
}
