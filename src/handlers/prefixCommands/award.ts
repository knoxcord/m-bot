import { OmitPartialGroupDMChannel, Message, GuildMember } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { CommandPrefix } from "./index.js";
import db from "../../database/db.js";
import configuration from "../../configuration/configuration.js";

export const Key = CommandKey.Award;

// Setup feature config
const RoleIdsThatCanAwardConfigurationKey = 'ROLE_IDS_THAT_CAN_AWARD';
configuration.registerConfigurations([
    ['Role Ids That Can Award', RoleIdsThatCanAwardConfigurationKey],
]);

const AwardRegex = /<?@?(?<userId>\d+)>?(?:\s(?<reason>.+))?/;
const enum SnowflakeRegexCapturingGroups {
    UserId = "userId",
    Reason = "reason"
};

export const awardHandler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    if (!message.inGuild())
        return;

    const commandBody = message.content.slice(Key.length + CommandPrefix.length).trim();
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

    const roleIdsThatCanMute = configuration.getConfigurationValue(message.guildId, RoleIdsThatCanAwardConfigurationKey)?.split(',') ?? [];
    if (roleIdsThatCanMute.length < 1) {
        console.warn(`Found empty roleIdsThatCanMute config for guildId ${message.guildId}`);
        return;
    }

    if (!authorUser.roles.cache.hasAny(...roleIdsThatCanMute)) {
        await message.reply("Ooph. This must be embarassing for you");
        return;
    }

    db.saveAward(message.guildId, userId, awardText);
    await message.reply("Done!");
}

export const Award: IPrefixCommand = {
    handler: awardHandler,
    key: Key
}