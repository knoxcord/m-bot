import { bold, GuildMember, inlineCode, Message, OmitPartialGroupDMChannel } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import configuration from "../../features/configuration/configuration.js";
import { RoleIdsThatCanMuteConfigurationKey } from "../../features/spank/config.js";
import db from "../../database/db.js";
import { getMissingPermissionResponse } from "../../shared/responses.js";

const TargetRegex = /<?@?(?<userId>\d+)>?/;
const enum SnowflakeRegexCapturingGroups {
    UserId = "userId",
};

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
    if (!message.guildId || !message.guild)
        return;

    const regexResult = commandBody.match(TargetRegex)?.groups;
    let targetUserId = message.author.id;
    if (regexResult)
        targetUserId = regexResult[SnowflakeRegexCapturingGroups.UserId];

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

    if (targetUserId != authorUserId && !authorUser.roles.cache.hasAny(...roleIdsThatCanMute)) {
        await message.reply(getMissingPermissionResponse(authorUserId));
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

    const { Invocations, Hits } = db.getRouletteStatsForUser(message.guildId, targetUserId);
    const hitRate = Invocations > 0 ? ((Hits / Invocations) * 100).toFixed(1) : "0.0";

    await message.reply(
        `${bold(targetUser.user.displayName)} has pulled the trigger ${Invocations} time${Invocations === 1 ? "" : "s"} `
        + `and been hit ${Hits} time${Hits === 1 ? "" : "s"} (${hitRate}%)`
    );
}

export const RussianRouletteStats: IPrefixCommand = {
    handler: handler,
    key: CommandKey.RussianRouletteStats,
    description: 'Shows Russian Roulette stats',
    usage: `Usage: ${inlineCode("russianroulettestats [<@user|userId>]")} (specifying a user requires permission)`
}
