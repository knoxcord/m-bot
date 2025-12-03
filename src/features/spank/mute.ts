import { OmitPartialGroupDMChannel, Message, GuildMember } from "discord.js";
import config from '../../config.json' with { type: "json" };
import db from "../../database/db.js";

const MutedRoleId = config.mutedRoleId;
const RoleIdsThatCanMute = config.roleIdsThatCanMute;
const SpankRegex = /<?@?(?<userId>\d+)>?(?:\s(?<reason>.+))?/;
const enum SnowflakeRegexCapturingGroups {
    UserId = "userId",
    Reason = "reason"
};

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
        await message.reply("Trying to spank yourself? :thinking:");
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

    if (!authorUser.roles.cache.hasAny(...RoleIdsThatCanMute)) {
        await message.reply("Ooph. This must be embarassing for you");
        return;
    }

    if (targetUser.roles.highest.position >= authorUser.roles.highest.position) {
        await message.reply("Sorry, you can't mute someone with an equal or higher role than your own.")
        return;
    }

    if (targetUser.roles.highest.position >= myUser.roles.highest.position) {
        await message.reply("Sorry, I dont have permission to mute that user");
        return;
    }


    try {
        await targetUser.roles.add(MutedRoleId);
    } catch (error) {
        console.error(`Failed to assigned muted role id ${MutedRoleId} to target user id ${targetUserId} with error ${error}`);
        return;
    }
    await message.reply(`Muted ${targetUser.user.displayName} for ${config.spankMuteDurationSeconds} seconds`)
    db.saveSpank(message.id, message.guildId, authorUser.user.id, targetUser.user.id, spankReason)
    setTimeout(async () => await removeRole(MutedRoleId, targetUser), config.spankMuteDurationSeconds * 1000);
}