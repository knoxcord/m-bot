import type { GuildMember, Message, OmitPartialGroupDMChannel } from "discord.js";
import { inlineCode } from "discord.js";
import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";
import configuration from "../../features/configuration/configuration.ts";
import { MutedRoleIdConfigurationKey } from "../../features/spank/config.ts";
import { ModeratorRoleIdsConfigurationKey } from "../../features/configuration/shared.ts";
import { cancelTemporaryRole } from "../../features/temporaryRoles/temporaryRoles.ts";
import { getMissingPermissionResponse } from "../../shared/responses.ts";

const TargetRegex = /<?@?(?<userId>\d+)>?/;
const enum SnowflakeRegexCapturingGroups {
    UserId = "userId",
};

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

    const moderatorRoleIds = configuration.getConfigurationValue(message.guildId, ModeratorRoleIdsConfigurationKey)?.split(',') ?? [];
    if (moderatorRoleIds.length < 1) {
        console.warn(`Found empty moderatorRoleIds config for guildId ${message.guildId}`);
    }
    if (!authorUser.roles.cache.hasAny(...moderatorRoleIds)) {
        await message.reply(getMissingPermissionResponse(authorUser.id));
        return;
    }

    const regexResult = commandBody.match(TargetRegex)?.groups;
    if (!regexResult) {
        await message.reply(`Usage: ${inlineCode("unmute <@user|userId>")}`);
        return;
    }
    const targetUserId = regexResult[SnowflakeRegexCapturingGroups.UserId];

    const mutedRoleId = configuration.getConfigurationValue(message.guildId, MutedRoleIdConfigurationKey);
    if (!mutedRoleId) {
        console.warn(`Muted role id not configured for guildId ${message.guildId}`);
        await message.reply("Muted role is not configured for this server.");
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

    let didUnmute = false;
    try {
        didUnmute = await cancelTemporaryRole(targetUser, mutedRoleId);
    } catch (error) {
        console.error(`Failed to cancel temporary role ${mutedRoleId} for user ${targetUserId} with error ${error}`);
        await message.reply("Failed to unmute the user.");
        return;
    }

    if(didUnmute)
        await message.react("👍");
}

export const Unmute: IPrefixCommand = {
    handler: handler,
    key: CommandKey.Unmute,
    description: 'Unmutes a target user (requires mute permission)',
    usage: `Usage: ${inlineCode("unmute <@user|userId>")} (requires mute permission)`,
}
