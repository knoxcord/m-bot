import { GuildMember, Message, OmitPartialGroupDMChannel } from "discord.js";
import configuration from "../configuration/configuration.js";
import { RoleIdsThatCanSayConfigurationKey } from "./config.js";
import { getMissingPermissionResponse } from "../../shared/responses.js";
import { Reply } from "../../handlers/prefixCommands/reply.js";

// Usage: -reply <#channel|channelId> <messageId> <message>
const ChannelMentionRegex = /^(?:<#)?(\d+)>?/;

export const replyHandler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
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
        await message.reply(getMissingPermissionResponse());
        return;
    }

    const channelMatch = commandBody.match(ChannelMentionRegex);
    if (!channelMatch) {
        await message.reply(Reply.helpMessage ?? "Invalid command");
        return;
    }

    const channelId = channelMatch[1];
    const remaining = commandBody.slice(channelMatch[0].length).trim();

    const spaceIndex = remaining.indexOf(' ');
    if (spaceIndex === -1) {
        await message.reply(Reply.helpMessage ?? "Invalid command");
        return;
    }

    const replyToId = remaining.slice(0, spaceIndex);
    const content = remaining.slice(spaceIndex).trim();

    if (!content) {
        await message.reply("You need to provide a message to send.");
        return;
    }

    const channel = await message.guild.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
        await message.reply("Invalid or inaccessible text channel.");
        return;
    }

    try {
        await channel.send({
            content,
            reply: { messageReference: replyToId },
        });
        await message.reply(`Reply sent to <#${channelId}>`);
    } catch {
        await message.reply(`Failed to send reply to <#${channelId}>. Make sure the message ID is valid.`);
    }
};
