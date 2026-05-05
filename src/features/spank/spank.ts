import type { OmitPartialGroupDMChannel, Message, GuildMember} from "discord.js";
import { userMention } from "discord.js";
import db from "../../database/db.ts";
import configuration from "../configuration/configuration.ts";
import { getMissingPermissionResponse } from "../../shared/responses.ts";
import { GlobalMutableChannelId, GlobalMutableRoleId, MutedDurationSecondsConfigurationKey, MutedRoleIdConfigurationKey, RoleIdsThatCanMuteConfigurationKey } from "./config.ts";

const SpankRegex = /<?@?(?<userId>\d+)>?(?:\s(?<reason>.+))?/;
const enum SnowflakeRegexCapturingGroups {
    UserId = "userId",
    Reason = "reason"
};

const removeRole = (roleId: string, user: GuildMember) =>
    user.roles.remove(roleId);

export const handleSpank = async (commandBody: string, message: OmitPartialGroupDMChannel<Message<true>>) => {
    const regexResult = commandBody.match(SpankRegex)?.groups;
    
    if (!regexResult) {
        await message.reply("Invalid user");
        return;
    }

    const targetUserId = regexResult[SnowflakeRegexCapturingGroups.UserId];
    const spankReason = regexResult[SnowflakeRegexCapturingGroups.Reason];

    if (!targetUserId) {
        await message.reply("Invalid user");
        return;
    }

    const authorUserId = message.author.id;
    if (targetUserId === authorUserId) {
        await message.reply("Take a stress pill and think things over.");
        return;
    }

    const myUser = message.guild.members.me;
    if (!myUser) {
        console.warn("Failed to resolve myUser");
        return
    }

    let authorUser: GuildMember;
    try {
        authorUser = await message.guild.members.fetch(authorUserId);
    } catch (error) {
        console.warn(`Failed to fetch authorUser for id: ${authorUserId} with error ${error}`);
        await message.reply("Sorry, I'm not sure who you are... How strange...");
        return;
    }

    let targetUser: GuildMember;
    try {
        targetUser = await message.guild.members.fetch(targetUserId);
    } catch (error) {
        console.warn(`Failed to fetch targetUser for id: ${targetUserId} with error ${error}`);
        await message.reply("Sorry, I can't find that user. Did you tag the right person?");
        return;
    }

    const roleIdsThatCanMute = configuration.getConfigurationValue(message.guildId, RoleIdsThatCanMuteConfigurationKey)?.split(',') ?? [];
    if (roleIdsThatCanMute.length < 1) {
        console.warn(`Found empty roleIdsThatCanMute config for guildId ${message.guildId}`);
        return;
    }
    const globalMutableRoleId = configuration.getConfigurationValue(message.guildId, GlobalMutableRoleId);

    const authorCanMute = authorUser.roles.cache.hasAny(...roleIdsThatCanMute);
    const targetIsGlobalMutable = globalMutableRoleId && targetUser.roles.cache.has(globalMutableRoleId);
    if (!authorCanMute && !targetIsGlobalMutable) {
        await message.reply(getMissingPermissionResponse(authorUserId));
        return;
    }

    const globalMutableChannelId = configuration.getConfigurationValue(message.guildId, GlobalMutableChannelId);
    const isGlobalMutableChannel = globalMutableChannelId ? message.channelId === globalMutableChannelId : true;
    if (!authorCanMute && !isGlobalMutableChannel) {
        await message.reply(`I'm sorry ${userMention(authorUserId)}. I'm afraid you can't do that here`);
        return;
    }

    if (targetUser.roles.highest.position >= myUser.roles.highest.position) {
        await message.reply(`I'm sorry ${userMention(authorUserId)}. I'm afraid I can't do that`);
        return;
    }

    const MutedRoleId = configuration.getConfigurationValue(message.guildId, MutedRoleIdConfigurationKey);
    if (!MutedRoleId) {
        console.warn(`Muted role id not configured for guildId ${message.guildId}`);
        await message.reply("This command requires configuration. Contact a bot admin before use.");
        return;
    }

    try {
        await targetUser.roles.add(MutedRoleId);
    } catch (error) {
        console.error(`Failed to assigned muted role id ${MutedRoleId} to target user id ${targetUserId} with error ${error}`);
        return;
    }

    const muteDurationSeconds = parseInt(configuration.getConfigurationValue(message.guildId, MutedDurationSecondsConfigurationKey) ?? "", 10) || 10;
    await message.reply(`Muted ${targetUser.user.displayName} for ${muteDurationSeconds} seconds`)
    db.saveSpank(message.id, message.guildId, authorUser.user.id, targetUser.user.id, spankReason)
    setTimeout(async () => await removeRole(MutedRoleId, targetUser), muteDurationSeconds * 1000);
}