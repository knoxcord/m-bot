import { OmitPartialGroupDMChannel, Message, userMention, blockQuote, GuildMember } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { getPreviousHourWindow } from "../../features/roleActivity/roleActivity.js";
import db from "../../database/db.js";
import configuration from "../../features/configuration/configuration.js";
import { getMissingPermissionResponse } from "../../shared/responses.js";
import { RoleIdsThatCanGetScoreConfigurationKey } from "./getScore.js";

const Key = CommandKey.TopMessagesLastHour;

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    if (!message.guildId || !message.guild) return;

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
        await message.reply(getMissingPermissionResponse());
        return;
    }

    const hourWindow = getPreviousHourWindow();
    const topUsers = db.getTopUsersForWindow(message.guildId, hourWindow);

    if (topUsers.length === 0) {
        await message.reply("No messages tracked for the current hour window");
        return;
    }

    const lines = topUsers.map((user, i) =>
        `${i + 1}. ${userMention(user.UserId)} (${message.guild?.roles.cache.get(user.RoleId)?.name ?? user.RoleId}) — ${user.Count} message${user.Count !== 1 ? 's' : ''}`
    );

    await message.reply(`Top messages this hour:\n${blockQuote(lines.join('\n'))}`);
}

export const TopMessagesLastHour: IPrefixCommand = {
    handler: handler,
    key: Key,
}
