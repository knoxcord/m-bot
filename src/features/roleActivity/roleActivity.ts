import { Client, Message, OmitPartialGroupDMChannel, TextChannel } from "discord.js";
import configuration from "../../configuration/configuration.js";
import db from "../../database/db.js";
import { TrackedRoleIdsConfigurationKey, RoleActivityChannelIdConfigurationKey } from "./config.js";

function getHourWindow(date: Date): string {
    const d = new Date(date);
    d.setMinutes(0, 0, 0);
    return d.toISOString();
}

function getPreviousHourWindow(): string {
    const now = new Date();
    now.setHours(now.getHours() - 1, 0, 0, 0);
    return now.toISOString();
}

export async function handleRoleActivityMessage(message: OmitPartialGroupDMChannel<Message<boolean>>) {
    if (!message.guildId || !message.member) return;

    const trackedRoleIdsValue = configuration.getConfigurationValue(message.guildId, TrackedRoleIdsConfigurationKey);
    if (!trackedRoleIdsValue) return;

    const trackedRoleIds = trackedRoleIdsValue.split(',').map(id => id.trim()).filter(Boolean);
    if (trackedRoleIds.length === 0) return;

    const hourWindow = getHourWindow(message.createdAt);

    for (const roleId of trackedRoleIds) {
        if (message.member.roles.cache.has(roleId)) {
            db.incrementRoleMessageCount(message.guildId, roleId, hourWindow);
        }
    }
}

export async function runRoleActivityHourlyJob(client: Client) {
    const previousHourWindow = getPreviousHourWindow();

    for (const [guildId, guild] of client.guilds.cache) {
        const trackedRoleIdsValue = configuration.getConfigurationValue(guildId, TrackedRoleIdsConfigurationKey);
        const channelId = configuration.getConfigurationValue(guildId, RoleActivityChannelIdConfigurationKey);

        if (!trackedRoleIdsValue || !channelId) continue;

        const trackedRoleIds = trackedRoleIdsValue.split(',').map(id => id.trim()).filter(Boolean);
        if (trackedRoleIds.length === 0) continue;

        const counts = db.getRoleMessageCountsForWindow(guildId, previousHourWindow);
        const countMap = new Map(counts.map(row => [row.RoleId, row.Count]));

        await guild.members.fetch();

        let mostActiveRoleId: string | null = null;
        let highestActivity = -1;

        for (const roleId of trackedRoleIds) {
            const role = guild.roles.cache.get(roleId);
            if (!role) continue;

            const memberCount = role.members.size;
            if (memberCount === 0) continue;

            const messageCount = countMap.get(roleId) ?? 0;
            const activity = messageCount / memberCount;

            if (activity > highestActivity) {
                highestActivity = activity;
                mostActiveRoleId = roleId;
            }
        }

        if (!mostActiveRoleId) continue;

        const mostActiveRole = guild.roles.cache.get(mostActiveRoleId);
        if (!mostActiveRole) continue;

        const channel = guild.channels.cache.get(channelId) as TextChannel | undefined;
        if (!channel) continue;

        const windowDate = new Date(previousHourWindow);
        const hourLabel = windowDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
        const messageCount = countMap.get(mostActiveRoleId) ?? 0;
        const memberCount = mostActiveRole.members.size;

        await channel.send(
            `Most active role for the hour ending at ${hourLabel} UTC: **${mostActiveRole.name}** ` +
            `(${messageCount} message${messageCount !== 1 ? 's' : ''} from ${memberCount} member${memberCount !== 1 ? 's' : ''})`
        );
    }
}

export function scheduleRoleActivityHourlyJob(client: Client) {
    const now = new Date();
    const msUntilNextHour =
        (60 - now.getMinutes()) * 60 * 1000 -
        now.getSeconds() * 1000 -
        now.getMilliseconds();

    setTimeout(() => {
        runRoleActivityHourlyJob(client);
        setInterval(() => runRoleActivityHourlyJob(client), 60 * 60 * 1000);
    }, msUntilNextHour);
}
