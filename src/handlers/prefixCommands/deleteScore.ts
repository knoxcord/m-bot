import { GuildMember, Message, OmitPartialGroupDMChannel } from "discord.js";
import { CommandKey, CommandPrefix, IPrefixCommand } from "./prefixCommandTypes.js";
import db from "../../database/db.js";
import configuration from "../../features/configuration/configuration.js";
import { getMissingPermissionResponse } from "../../shared/responses.js";
import { RoleIdsThatCanSetScoreConfigurationKey } from "./setScore.js";

const DeleteScoreRegex = /<?@?(?<userId>\d+)>?/;
const enum DeleteScoreRegexCapturingGroups {
    UserId = "userId",
};

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

    const commandBody = message.content.slice(CommandKey.DeleteScore.length + CommandPrefix.length).trim();

    const regexResult = commandBody.match(DeleteScoreRegex)?.groups;
    if (!regexResult) {
        await message.channel.send("Invalid format. Usage: `-deletescore @user`");
        return;
    }

    const targetUserId = regexResult[DeleteScoreRegexCapturingGroups.UserId];
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

    const result = db.deleteScoreSubmission(message.guildId, targetUserId);
    if (result.changes < 1) {
        await message.reply(`${targetUser.user.displayName} has no score to delete`);
        return;
    }

    await message.reply(`Score for ${targetUser.user.displayName} has been deleted`);
};

export const DeleteScore: IPrefixCommand = {
    handler: handler,
    key: CommandKey.DeleteScore,
};
