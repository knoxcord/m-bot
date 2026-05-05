import type { GuildMember, Message, OmitPartialGroupDMChannel } from "discord.js";
import configuration from "../configuration/configuration.ts";
import { RoleIdsThatCanSayConfigurationKey } from "./config.ts";
import { getMissingPermissionResponse } from "../../shared/responses.ts";
import { React } from "../../handlers/prefixCommands/react.ts";

const ChannelMentionRegex = /^(?:<#)?(\d+)>?/;

const parseEmojis = (input: string): string[] => {
    const customEmojiPattern = /<a?:\w+:\d+>/g;
    const unicodeEmojiPattern = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;

    const emojis = new Set<string>();
    let remaining = input;

    for (const match of input.matchAll(customEmojiPattern)) {
        emojis.add(match[0]);
        remaining = remaining.replace(match[0], " ");
    }

    for (const match of remaining.matchAll(unicodeEmojiPattern)) {
        emojis.add(match[0]);
    }

    return [...emojis];
};

export const reactHandler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
    if (!message.inGuild())
        return;

    const authorUserId = message.author.id;
    let authorUser: GuildMember;
    try {
        authorUser = await message.guild.members.fetch(authorUserId);
    } catch (error) {
        console.warn(`Failed to fetch authorUser for id: ${authorUserId} with error ${error}`);
        await message.reply("Sorry, I'm not sure who you are... How strange...");
        return;
    }

    const roleIdsThatCanSay = configuration.getConfigurationValue(message.guildId, RoleIdsThatCanSayConfigurationKey)?.split(',') ?? [];
    if (roleIdsThatCanSay.length < 1) {
        console.warn(`Found empty roleIdsThatCanSay config for guildId ${message.guildId}`);
        return;
    }

    if (!authorUser.roles.cache.hasAny(...roleIdsThatCanSay)) {
        await message.reply(getMissingPermissionResponse(authorUserId));
        return;
    }

    const channelMatch = commandBody.match(ChannelMentionRegex);
    if (!channelMatch) {
        await message.reply(React.usage ?? "Invalid usage");
        return;
    }

    const channelId = channelMatch[1];
    const remaining = commandBody.slice(channelMatch[0].length).trim();

    const spaceIndex = remaining.indexOf(' ');
    if (spaceIndex === -1) {
        await message.reply(React.usage ?? "Invalid usage");
        return;
    }

    const messageId = remaining.slice(0, spaceIndex);
    const emojisInput = remaining.slice(spaceIndex).trim();

    const emojis = parseEmojis(emojisInput);
    if (emojis.length === 0) {
        await message.reply("No valid emojis found in your input.");
        return;
    }

    const channel = await message.guild.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
        await message.reply("Invalid or inaccessible text channel.");
        return;
    }

    try {
        const targetMessage = await channel.messages.fetch(messageId);

        const results = await Promise.allSettled(
            emojis.map(emoji => targetMessage.react(emoji))
        );

        const failed = results.filter(r => r.status === "rejected").length;

        if (failed === emojis.length) {
            await message.reply("Failed to add any reactions. Make sure the emojis are valid and the bot has access to them.");
        } else if (failed > 0) {
            await message.reply(`Added ${emojis.length - failed}/${emojis.length} reactions. Some emojis may be invalid or unavailable.`);
        } else {
            await message.reply(`Reacted with ${emojis.join(" ")}`);
        }
    } catch {
        await message.reply(`Failed to react. Make sure the bot has access to <#${channelId}> and the message ID is valid.`);
    }
};
