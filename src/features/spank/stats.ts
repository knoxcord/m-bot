import { Message, OmitPartialGroupDMChannel } from "discord.js";
import db from "../../database/db.js";

const StatsRegex = /<?@?(?<userId>\d+)>?/;
const enum StatsRegexCaptingGroups {
    UserId = "userId",
};

const padNumber = (num: number) => String(num).padStart(2, "0");

const getRecentSpankString = (recentSpank: {
    Reason: string;
    CreatedAt: string;
}) => {
    const date = new Date(`${recentSpank.CreatedAt}Z`);
    const dateString = `${date.getFullYear()}-${padNumber(date.getMonth())}-${padNumber(date.getDate())} ${padNumber(date.getHours())}:${padNumber(date.getMinutes())}:${padNumber(date.getSeconds())}`
    const reasonString = recentSpank.Reason ?? "[no reason specified]";
    return `\`${dateString}\`: ${reasonString}`
}

export const handleStats = async (commandBody: string, message: OmitPartialGroupDMChannel<Message<true>>) => {
    const regexResult = commandBody.match(StatsRegex)?.groups;
    if (!regexResult) {
        await message.channel.send("Invalid user");
        return;
    }

    const targetUserId = regexResult[StatsRegexCaptingGroups.UserId];
    if (!targetUserId) {
        await message.channel.send("Invalid user");
        return;
    }

    const targetUser = await message.guild.members.fetch(targetUserId);
    const totalSpanks = db.getSpankCountForSpankee(targetUserId, message.guildId) ?? 0;
    const recentSpanks = db.getRecentSpankReasonsForSpankee(targetUserId, message.guildId);

    let reply = `${targetUser.user.username} has received ${totalSpanks} spank${totalSpanks === 1 ? "" : "s"}`;

    if (recentSpanks && recentSpanks.length > 0) {
        reply += `:\n${recentSpanks.map(getRecentSpankString).join("\n")}`
    }

    await message.reply(reply)
}