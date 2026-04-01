import { OmitPartialGroupDMChannel, Message, userMention, blockQuote } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { getPreviousHourWindow } from "../../features/roleActivity/roleActivity.js";
import db from "../../database/db.js";

const Key = CommandKey.TopMessagesLastHour;

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    if (!message.guildId) return;

    const hourWindow = getPreviousHourWindow();
    const topUsers = db.getTopUsersForWindow(message.guildId, hourWindow);

    if (topUsers.length === 0) {
        await message.reply("No messages tracked for the current hour window");
        return;
    }

    const lines = topUsers.map((user, i) =>
        `${i + 1}. ${userMention(user.UserId)} — ${user.Count} message${user.Count !== 1 ? 's' : ''}`
    );

    await message.reply(`Top messages this hour:\n${blockQuote(lines.join('\n'))}`);
}

export const TopMessagesLastHour: IPrefixCommand = {
    handler: handler,
    key: Key,
}
