import { GuildMember, Message, OmitPartialGroupDMChannel } from "discord.js";
import { CommandKey, CommandPrefix, IPrefixCommand } from "./prefixCommandTypes.js";
import { ConfigurationRegistration } from "../../features/configuration/configurationTypes.js";
import db from "../../database/db.js";
import configuration from "../../features/configuration/configuration.js";
import { getMissingPermissionResponse } from "../../shared/responses.js";
import config from "../../config.json" with { type: "json" };

const SetScoreRegex = /<?@?(?<userId>\d+)>?\s+(?<score>\d+)/;
const enum SetScoreRegexCapturingGroups {
    UserId = "userId",
    Score = "score",
};

const RoleIdsThatCanSetScoreConfigurationKey = 'ROLE_IDS_THAT_CAN_SET_SCORE';

export const setScoreConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Role Ids That Can Set Score', RoleIdsThatCanSetScoreConfigurationKey]
];

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
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
        await message.reply(getMissingPermissionResponse());
        return;
    }

    const commandBody = message.content.slice(CommandKey.SetScore.length + CommandPrefix.length).trim();

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

    // Remove any relevent already assigned roles
    await Promise.all(
        [config.UnsortedRoleId, config.MonkRoleId, config.NormieRoleId, config.PerformerRoleId]
            .filter(roleId => targetUser.roles.cache.has(roleId))
            .map(roleId => targetUser.roles.remove(roleId))
    );

    // Assign the correct role based on the score
    let newRole = config.PerformerRoleId;
    if (score >= 90) {
        newRole = config.MonkRoleId;
    } else if (score >= 80) {
        newRole = config.NormieRoleId;
    }
    await targetUser.roles.add(newRole);

    const roleName = message.guild.roles.cache.get(newRole)?.name ?? newRole;
    await message.reply(`Score for ${targetUser.user.displayName} set to ${score} and role updated to ${roleName}`);
};

export const SetScore: IPrefixCommand = {
    handler: handler,
    key: CommandKey.SetScore,
};
