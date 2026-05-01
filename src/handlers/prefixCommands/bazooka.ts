import { bold, GuildMember, heading, inlineCode, italic, Message, OmitPartialGroupDMChannel, subtext } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import configuration from "../../features/configuration/configuration.js";
import { MutedRoleIdConfigurationKey } from "../../features/spank/config.js";

// This is a silly one-off feature
const TargetRegex = /<?@?(?<userId>\d+)>?/;
const enum SnowflakeRegexCapturingGroups {
    UserId = "userId",
};

const removeRole = (roleId: string, user: GuildMember) =>
    user.roles.remove(roleId);

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
    if (!message.guildId || !message.guild)
        return;

    // personal server and test server
    if (message.guildId != '1220760834658009241' && message.guildId != '1252711007734857839')
        return;

    // mkwarman or pawawool
    if (message.author.id != '306813210634485761' && message.author.id != '335447251671318538')
        return;

    const regexResult = commandBody.match(TargetRegex)?.groups;
    if (!regexResult) {
        await message.reply(`Usage: ${inlineCode("bazooka <@user|userId>")}`);
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
            const muteDurationMS = 2147483647; // int 32 max
            replyMessageLines.push(subtext(`Muted ${targetUser.user.displayName} for a million fucking years`));
            setTimeout(async () => await removeRole(MutedRoleId, targetUser), muteDurationMS);
        }
    } catch (error) {
        console.error(`Failed to assigned muted role id ${MutedRoleId} to target user id ${targetUserId} with error ${error}`);
        return;
    }

    await message.reply(replyMessageLines.join("\n"));
}

export const Bazooka: IPrefixCommand = {
    handler: handler,
    key: CommandKey.Bazooka
}
