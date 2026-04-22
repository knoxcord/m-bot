import { GuildMember, Message, OmitPartialGroupDMChannel } from "discord.js";
import configuration from "../configuration/configuration.js";
import { RoleIdsThatCanSayConfigurationKey } from "./config.js";
import { getMissingPermissionResponse } from "../../shared/responses.js";
import { Say } from "../../handlers/prefixCommands/say.js";

const ChannelMentionRegex = /^(?:<#)?(\d+)>?/;

export const sayHandler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
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
        await message.reply(Say.usage ?? "Invalid usage");
        return;
    }

    const channelId = channelMatch[1];
    const remaining = commandBody.slice(channelMatch[0].length).trim();

    if (!remaining) {
        await message.reply("You need to provide a message to send.");
        return;
    }

    const channel = await message.guild.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
        await message.reply("Invalid or inaccessible text channel.");
        return;
    }

    try {
        await channel.send({ content: remaining });
        await message.reply(`Message sent to <#${channelId}>`);
    } catch {
        await message.reply(`Failed to send message to <#${channelId}>.`);
    }
};
