import type { GuildMember, Message, OmitPartialGroupDMChannel } from "discord.js";
import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";
import type { ConfigurationRegistration } from "../../features/configuration/configurationTypes.ts";
import db from "../../database/db.ts";
import configuration from "../../features/configuration/configuration.ts";
import { getMissingPermissionResponse } from "../../shared/responses.ts";

const GetScoreRegex = /<?@?(?<userId>\d+)>?/;
const enum GetScoreRegexCapturingGroups {
    UserId = "userId",
};

export const RoleIdsThatCanGetScoreConfigurationKey = 'ROLE_IDS_THAT_CAN_GET_SCORE';

export const getScoreConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Role Ids That Can Get Score', RoleIdsThatCanGetScoreConfigurationKey]
];

const padNumber = (num: number) => String(num).padStart(2, "0");

const getScoreString = (submission: { Score: number; CreatedAt: string }) => {
    const date = new Date(`${submission.CreatedAt}Z`);
    const dateString = `${date.getFullYear()}-${padNumber(date.getMonth())}-${padNumber(date.getDate())} ${padNumber(date.getHours())}:${padNumber(date.getMinutes())}:${padNumber(date.getSeconds())}`;
    return `\`${dateString}\`: ${submission.Score}`;
};

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
    if (!message.inGuild())
        return;

    const roleIdsThatCanGetScore = configuration.getConfigurationValue(message.guildId, RoleIdsThatCanGetScoreConfigurationKey)?.split(',') ?? [];
    if (roleIdsThatCanGetScore.length < 1) {
        console.warn(`Found empty roleIdsThatCanGetScore config for guildId ${message.guildId}`);
        return;
    }

    let authorUser: GuildMember;
    try {
        authorUser = await message.guild.members.fetch(message.author.id);
    } catch (error) {
        console.warn(`Failed to fetch authorUser for id: ${message.author.id} with error ${error}`);
        await message.reply("Sorry, I'm not sure who you are... How strange...");
        return;
    }

    if (!authorUser.roles.cache.hasAny(...roleIdsThatCanGetScore)) {
        await message.reply(getMissingPermissionResponse(authorUser.id));
        return;
    }

    const regexResult = commandBody.match(GetScoreRegex)?.groups;
    if (!regexResult) {
        await message.channel.send("Invalid user");
        return;
    }

    const targetUserId = regexResult[GetScoreRegexCapturingGroups.UserId];
    if (!targetUserId) {
        await message.channel.send("Invalid user");
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

    const submission = db.getScoreSubmissionForUser(message.guildId, targetUserId);

    if (!submission) {
        await message.reply(`${targetUser.user.displayName} has no score submission`);
        return;
    }

    await message.reply(getScoreString(submission));
};

export const GetScore: IPrefixCommand = {
    handler: handler,
    key: CommandKey.GetScore,
};
