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

    const authorUser = await message.guild.members.fetch(authorUserId);
    if (!authorUser) {
        console.warn(`Failed to fetch authorUser for id: ${authorUserId}`);
        return
    }

    const targetUser = await message.guild.members.fetch(targetUserId);
    if (!targetUser) {
        console.warn(`Failed to fetch targetUser for id: ${targetUserId}`);
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

    db.saveSpank(message.id, message.guildId, authorUser.user.id, targetUser.user.id, spankReason)
    await targetUser.roles.add(MutedRoleId);
    setTimeout(async () => await removeRole(MutedRoleId, targetUser), 10000);
}