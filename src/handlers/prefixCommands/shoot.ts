import { bold, GuildMember, heading, inlineCode, italic, Message, OmitPartialGroupDMChannel, subtext } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import configuration from "../../features/configuration/configuration.js";
import { MutedRoleIdConfigurationKey, RoleIdsThatCanMuteConfigurationKey } from "../../features/spank/config.js";
import { RouletteMutedDurationSecondsConfigurationKey } from "./russianRoulette.js";

const TargetRegex = /<?@?(?<userId>\d+)>?/;
const enum SnowflakeRegexCapturingGroups {
    UserId = "userId",
};

const removeRole = (roleId: string, user: GuildMember) =>
    user.roles.remove(roleId);

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
    if (!message.guildId || !message.guild)
        return;

    const authorUserId = message.author.id;
    let authorUser: GuildMember;
    try {
        authorUser = await message.guild.members.fetch(authorUserId);
    } catch (error) {
        console.warn(`Failed to fetch authorUser for id: ${authorUserId} with error ${error}`);
        return;
    }

    const roleIdsThatCanMute = configuration.getConfigurationValue(message.guildId, RoleIdsThatCanMuteConfigurationKey)?.split(',') ?? [];
    if (roleIdsThatCanMute.length < 1) {
        console.warn(`Found empty roleIdsThatCanMute config for guildId ${message.guildId}`);
    }

    const regexResult = commandBody.match(TargetRegex)?.groups;
    if (!regexResult) {
        await message.reply(`Usage: ${inlineCode("shoot <@user|userId>")}`);
        return;
    }
    const targetUserId = regexResult[SnowflakeRegexCapturingGroups.UserId];

    let targetUser: GuildMember;
    try {
        targetUser = await message.guild.members.fetch(targetUserId);
    } catch (error) {
        console.warn(`Failed to fetch targetUser for id: ${targetUserId} with error ${error}`);
        await message.reply("Sorry, I can't find that user. Did you tag the right person?");
        return;
    }

    const replyMessageLines: string[] = [
        heading(bold(italic("BANG!"))),
    ];    // If user is attempting to target someone else but doesnt have permission
    const handSlip = targetUserId != authorUserId && !authorUser.roles.cache.hasAny(...roleIdsThatCanMute);
    if (handSlip) {
        replyMessageLines.unshift(italic('Your hand slips as you aim the gun at your target...'));
        targetUser = authorUser;
    }

    let canMute = true;
    const myUser = message.guild.members.me;
    if (!myUser) {
        console.warn("Failed to resolve myUser");
        canMute = false;
    }

    if (!myUser || targetUser.roles.highest.position >= myUser.roles.highest.position) {
        console.info(`Unable to mute target userId ${targetUserId} due to role position`);
        canMute = false;
    }

    const MutedRoleId = configuration.getConfigurationValue(message.guildId, MutedRoleIdConfigurationKey);
    if (!MutedRoleId) {
        console.warn(`Muted role id not configured for guildId ${message.guildId}`);
        canMute = false;
    }

    try {
        if (canMute && MutedRoleId) {
            await targetUser.roles.add(MutedRoleId);
            const muteDurationSeconds = parseInt(configuration.getConfigurationValue(message.guildId, RouletteMutedDurationSecondsConfigurationKey) ?? "", 10) || 10;
            replyMessageLines.push(subtext(`Muted ${targetUser.user.displayName} for ${muteDurationSeconds} seconds`));
            setTimeout(async () => await removeRole(MutedRoleId, targetUser), muteDurationSeconds * 1000);
        }
    } catch (error) {
        console.error(`Failed to assigned muted role id ${MutedRoleId} to target user id ${targetUserId} with error ${error}`);
        return;
    }

    await message.reply(replyMessageLines.join("\n"));
}

export const Shoot: IPrefixCommand = {
    handler: handler,
    key: CommandKey.Shoot,
    description: 'Shoots a target user (requires mute permission)',
    usage: `Usage: ${inlineCode("shoot <@user|userId>")} (requires mute permission)`
}
