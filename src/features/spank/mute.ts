import { OmitPartialGroupDMChannel, Message, GuildMember } from "discord.js";
import db from "../../database/db.js";
import configuration from "../../configuration/configuration.js";
import { getMissingPermissionResponse } from "../../shared/responses.js";

const SpankRegex = /<?@?(?<userId>\d+)>?(?:\s(?<reason>.+))?/;
const enum SnowflakeRegexCapturingGroups {
    UserId = "userId",
    Reason = "reason"
};

// Setup feature config
const MutedRoleIdConfigurationKey = 'MUTED_ROLE_ID';
const MutedDurationSecondsConfigurationKey = 'MUTED_DURATION_SECONDS';
const RoleIdsThatCanMuteConfigurationKey = 'ROLE_IDS_THAT_CAN_MUTE';
configuration.registerConfigurations([
    ['Muted Role Id', MutedRoleIdConfigurationKey],
    ['Muted Duration Seconds', MutedDurationSecondsConfigurationKey],
    ['Role Ids That Can Mute', RoleIdsThatCanMuteConfigurationKey],
]);

const removeRole = (roleId: string, user: GuildMember) =>
    user.roles.remove(roleId);

export const handleMute = async (commandBody: string, message: OmitPartialGroupDMChannel<Message<true>>) => {
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
        await message.reply(`Trying to smack yourself? :thinking:`);
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

    if (!authorUser.roles.cache.hasAny(...roleIdsThatCanMute)) {
        await message.reply(getMissingPermissionResponse());
        return;
    }

    if (targetUser.roles.highest.position >= myUser.roles.highest.position) {
        await message.reply("Sorry, I dont have permission to mute that user");
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