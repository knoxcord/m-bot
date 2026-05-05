import type { GuildMember, Message, OmitPartialGroupDMChannel } from "discord.js";
import db from "../../database/db.ts";

const RecentReasonsLimit = 5;
const TopSpankeesLimit = 5;
const StatsRegex = /<?@?(?<userId>\d+)>?/;
const enum StatsRegexCaptingGroups {
    UserId = "userId",
};
const TopArgument = "top";

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

const getTopSpankees = async (message: OmitPartialGroupDMChannel<Message<true>>) => {
    const topSpankees = db.getTopSpankees(message.guildId, TopSpankeesLimit);

    let reply = "Top troublemakers:";
    for (const topSpankee of topSpankees) {
        try {
            const spankeeUser = await message.guild.members.fetch(topSpankee.SpankeeUserId);
            reply += `\n${spankeeUser.user.displayName} has received ${topSpankee.totalSpanks} smack${topSpankee.totalSpanks === 1 ? "" : "s"}`;
        } catch (e) {
            console.warn('Failed to retrieve spankee username with error', e);
            reply += `\n[Unknown User] has received ${topSpankee.totalSpanks} smack${topSpankee.totalSpanks === 1 ? "" : "s"}`;
        }
    };

    await message.reply(reply)
}

export const handleStats = async (commandBody: string, message: OmitPartialGroupDMChannel<Message<true>>) => {
    if (commandBody.toLocaleLowerCase().trim() == TopArgument)
        return getTopSpankees(message);

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

    let targetUser: GuildMember;
    try {
        targetUser = await message.guild.members.fetch(targetUserId);
    } catch (error) {
        console.warn(`Failed to fetch targetUser for id: ${targetUserId} with error ${error}`);
        await message.reply("Sorry, I can't find that user. Did you tag the right person?");
        return;
    }

    const totalSpanks = db.getSpankCountForSpankee(targetUserId, message.guildId) ?? 0;
    const recentSpanks = db.getRecentSpankReasonsForSpankee(targetUserId, message.guildId, RecentReasonsLimit);

    let reply = `${targetUser.user.displayName} has received ${totalSpanks} smack${totalSpanks === 1 ? "" : "s"}`;

    if (recentSpanks && recentSpanks.length > 0) {
        reply += `\nRecent reasons:\n${recentSpanks.map(getRecentSpankString).join("\n")}`
    }

    await message.reply(reply)
}