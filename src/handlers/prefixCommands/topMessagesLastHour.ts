import type { OmitPartialGroupDMChannel, Message, GuildMember } from "discord.js";
import { userMention, blockQuote } from "discord.js";
import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";
import { getPreviousHourWindow } from "../../features/roleActivity/roleActivity.ts";
import db from "../../database/db.ts";
import configuration from "../../features/configuration/configuration.ts";
import { getMissingPermissionResponse } from "../../shared/responses.ts";
import { RoleIdsThatCanGetScoreConfigurationKey } from "./getScore.ts";

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
        await message.reply(getMissingPermissionResponse(authorUser.id));
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

    const windowDate = new Date(hourWindow);
    const hourLabel = windowDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
    await message.reply(`Top messages for the ${hourLabel} ET hour window:\n${blockQuote(lines.join('\n'))}`);
}

export const TopMessagesLastHour: IPrefixCommand = {
    handler: handler,
    key: Key,
}
