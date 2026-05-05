import type { OmitPartialGroupDMChannel, Message, GuildMember } from "discord.js";
import db from "../../database/db.ts";
import configuration from "../configuration/configuration.ts";
import { RoleIdsThatCanAwardConfigurationKey } from "./config.ts";

const AwardRegex = /<?@?(?<userId>\d+)>?(?:\s(?<reason>.+))?/;
const enum SnowflakeRegexCapturingGroups {
    UserId = "userId",
    Reason = "reason"
};

export const awardHandler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
    if (!message.inGuild())
        return;

    const regexResult = commandBody.match(AwardRegex)?.groups;
    
    if (!regexResult) {
        await message.reply("Invalid user");
        return;
    }

    const userId = regexResult[SnowflakeRegexCapturingGroups.UserId];
    const awardText = regexResult[SnowflakeRegexCapturingGroups.Reason];

    if (!userId) {
        await message.reply("Invalid user");
        return;
    }

    if (!awardText) {
        await message.reply("Invalid award");
        return;
    }

    const authorUserId = message.author.id;
    let authorUser: GuildMember;
    try {
        authorUser = await message.guild.members.fetch(authorUserId);
    } catch (error) {
        console.warn(`Failed to fetch authorUser for id: ${authorUserId} with error ${error}`);
        await message.reply("Sorry, I'm not sure who you are... How strange...");
        return;
    }

    const roleIdsThatCanAward = configuration.getConfigurationValue(message.guildId, RoleIdsThatCanAwardConfigurationKey)?.split(',') ?? [];
    if (roleIdsThatCanAward.length < 1) {
        console.warn(`Found empty roleIdsThatCanAward config for guildId ${message.guildId}`);
        return;
    }

    if (!authorUser.roles.cache.hasAny(...roleIdsThatCanAward)) {
        await message.reply("Ooph. This must be embarassing for you");
        return;
    }

    db.saveAward(message.guildId, userId, awardText);
    await message.reply("Done!");
}