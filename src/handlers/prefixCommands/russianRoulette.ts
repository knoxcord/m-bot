import type { GuildMember, Message, OmitPartialGroupDMChannel} from "discord.js";
import { bold, heading, inlineCode, italic, subtext } from "discord.js";
import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";
import configuration from "../../features/configuration/configuration.ts";
import { MutedRoleIdConfigurationKey, RoleIdsThatCanMuteConfigurationKey } from "../../features/spank/config.ts";
import type { ConfigurationRegistration } from "../../features/configuration/configurationTypes.ts";
import db from "../../database/db.ts";

const TargetRegex = /<?@?(?<userId>\d+)>?/;
const enum SnowflakeRegexCapturingGroups {
    UserId = "userId",
};


// Setup feature config
export const RouletteMutedDurationSecondsConfigurationKey = 'ROULETTE_MUTED_DURATION_SECONDS';
export const RouletteAllowedChannelIdsConfigurationKey = 'ROULETTE_ALLOWED_CHANNEL_IDS';

export const rouletteConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Roulette Muted Duration Seconds', RouletteMutedDurationSecondsConfigurationKey],
    ['Roulette Allowed Channel Ids', RouletteAllowedChannelIdsConfigurationKey]
];


const removeRole = (roleId: string, user: GuildMember) =>
    user.roles.remove(roleId);

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
    if (!message.guildId || !message.guild)
        return;

    // If we run into an error resolving permissions, we can at least reply to the message.
    // We'll use this to keep track of whether we should actually mute or not
    let canMute = true;

    const regexResult = commandBody.match(TargetRegex)?.groups;
    let targetUserId = message.author.id;
    if (regexResult)
        targetUserId = regexResult[SnowflakeRegexCapturingGroups.UserId];

    const myUser = message.guild.members.me;
    if (!myUser) {
        console.warn("Failed to resolve myUser");
        canMute = false;
    }

    const authorUserId = message.author.id;
    let authorUser: GuildMember;
    try {
        authorUser = await message.guild.members.fetch(authorUserId);
    } catch (error) {
        console.warn(`Failed to fetch authorUser for id: ${authorUserId} with error ${error}`);
        canMute = false;
        return;
    }

    const roleIdsThatCanMute = configuration.getConfigurationValue(message.guildId, RoleIdsThatCanMuteConfigurationKey)?.split(',') ?? [];
    if (roleIdsThatCanMute.length < 1) {
        console.warn(`Found empty roleIdsThatCanMute config for guildId ${message.guildId}`);
    }
    const authorCanMute = authorUser.roles.cache.hasAny(...roleIdsThatCanMute);

    // Allow restriction to specific channel(s) for users without mute permission
    const allowedChannelIds = configuration.getConfigurationValue(message.guildId, RouletteAllowedChannelIdsConfigurationKey)?.split(',') ?? [];
    if (!authorCanMute && allowedChannelIds.length > 0 && !allowedChannelIds.includes(message.channelId))
        return;

    let targetUser: GuildMember;
    try {
        targetUser = await message.guild.members.fetch(targetUserId);
    } catch (error) {
        console.warn(`Failed to fetch targetUser for id: ${targetUserId} with error ${error}`);
        await message.reply("Sorry, I can't find that user. Did you tag the right person?");
        return;
    }

    const replyMessageLines: string[] = [];
    // If user is attempting to target someone else but doesnt have permission
    const handSlip = targetUserId != authorUserId && !authorCanMute;
    if (handSlip) {
        replyMessageLines.push(italic('Your hand slips as you aim the gun at your target...'));
        targetUser = authorUser;
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

    const didHit = handSlip || Math.floor(Math.random() * 6) == 0;
    replyMessageLines.push(didHit
        ? heading(bold(italic("BANG!")))
        : subtext(italic("click"))
    );

    db.recordRouletteShot(message.guildId, targetUserId, didHit);

    try {
        if (canMute && MutedRoleId && didHit) {
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

export const RussianRoulette: IPrefixCommand = {
    handler: handler,
    key: CommandKey.RussianRoulette,
    description: 'Plays Russian Roulette',
    usage: `Usage: ${inlineCode("russianroulette [<@user|userId>]")} (specifying a user requires permission)`
}
