import type { GuildMember, Message, OmitPartialGroupDMChannel } from "discord.js";
import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";
import type { ConfigurationRegistration } from "../../features/configuration/configurationTypes.ts";
import db from "../../database/db.ts";
import configuration from "../../features/configuration/configuration.ts";
import { getMissingPermissionResponse } from "../../shared/responses.ts";

const SetScoreRegex = /<?@?(?<userId>\d+)>?\s+(?<score>\d+)/;
const enum SetScoreRegexCapturingGroups {
    UserId = "userId",
    Score = "score",
};

export const RoleIdsThatCanSetScoreConfigurationKey = 'ROLE_IDS_THAT_CAN_SET_SCORE';

export const setScoreConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Role Ids That Can Set Score', RoleIdsThatCanSetScoreConfigurationKey]
];

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
    if (!message.inGuild())
        return;

    const roleIdsThatCanSetScore = configuration.getConfigurationValue(message.guildId, RoleIdsThatCanSetScoreConfigurationKey)?.split(',') ?? [];
    if (roleIdsThatCanSetScore.length < 1) {
        console.warn(`Found empty roleIdsThatCanSetScore config for guildId ${message.guildId}`);
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

    if (!authorUser.roles.cache.hasAny(...roleIdsThatCanSetScore)) {
        await message.reply(getMissingPermissionResponse(authorUser.id));
        return;
    }

    const regexResult = commandBody.match(SetScoreRegex)?.groups;
    if (!regexResult) {
        await message.channel.send("Invalid format. Usage: `-setscore @user 85`");
        return;
    }

    const targetUserId = regexResult[SetScoreRegexCapturingGroups.UserId];
    if (!targetUserId) {
        await message.channel.send("Invalid user");
        return;
    }

    const score = parseInt(regexResult[SetScoreRegexCapturingGroups.Score], 10);
    if (isNaN(score) || score < 0 || score > 100) {
        await message.channel.send("Score must be a number between 0 and 100");
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

    db.saveScoreSubmission(message.guildId, targetUserId, score);
    await message.reply(`Score for ${targetUser.user.displayName} set to ${score}`);
};

export const SetScore: IPrefixCommand = {
    handler: handler,
    key: CommandKey.SetScore,
};
