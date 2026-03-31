import { blockQuote, Client, Guild, Message, OmitPartialGroupDMChannel, TextChannel } from "discord.js";
import configuration from "../configuration/configuration.js";
import db from "../../database/db.js";
import { TrackedRoleIdsConfigurationKey, RoleActivityChannelIdConfigurationKey, RoleActivityFeatureFlag, RoleActivityReportingFeatureFlag } from "./config.js";
import featureFlags from "../featureFlags/featureFlags.js";

export const getHourWindowForDate = (date: Date): string => {
    const d = new Date(date);
    d.setMinutes(0, 0, 0);
    return d.toISOString();
}

const getPreviousHourWindow = (): string => {
    const now = new Date();
    now.setHours(now.getHours() - 1, 0, 0, 0);
    return now.toISOString();
}

export const handleRoleActivityMessage = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    if (!message.guildId || !message.member) return;

    const featureFlagEnabled = featureFlags.getFeatureFlag(message.guildId, RoleActivityFeatureFlag);
    if (!featureFlagEnabled)
        return;

    const trackedRoleIdsValue = configuration.getConfigurationValue(message.guildId, TrackedRoleIdsConfigurationKey);
    if (!trackedRoleIdsValue) return;

    const trackedRoleIds = trackedRoleIdsValue.split(',').map(id => id.trim()).filter(Boolean);
    if (trackedRoleIds.length === 0) return;

    const hourWindow = getHourWindowForDate(message.createdAt);

    for (const roleId of trackedRoleIds) {
        if (message.member.roles.cache.has(roleId)) {
            db.incrementRoleMessageCount(message.guildId, roleId, hourWindow);
        }
    }
}

export const reportActivityForServer = async (guildId: string, guild: Guild, hourWindow: string) => {
    const trackedRoleIdsValue = configuration.getConfigurationValue(guildId, TrackedRoleIdsConfigurationKey);
    const channelId = configuration.getConfigurationValue(guildId, RoleActivityChannelIdConfigurationKey);

    if (!trackedRoleIdsValue || !channelId) return;

    const trackedRoleIds = trackedRoleIdsValue.split(',').map(id => id.trim()).filter(Boolean);
    if (trackedRoleIds.length === 0) return;

    const counts = db.getRoleMessageCountsForWindow(guildId, hourWindow);
    const countMap = new Map(counts.map(row => [row.RoleId, row.Count]));

    if (guild.members.cache.size < guild.memberCount) {
        await guild.members.fetch();
    }

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

    if (!mostActiveRoleId) {
        console.info("Not reporting role activity due to no activity");
        return;
    }

    const mostActiveRole = guild.roles.cache.get(mostActiveRoleId);
    if (!mostActiveRole) return;

    const channel = guild.channels.cache.get(channelId) as TextChannel | undefined;
    if (!channel) return;

    const windowDate = new Date(hourWindow);
    const hourLabel = windowDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
    const messageCount = countMap.get(mostActiveRoleId) ?? 0;
    const memberCount = mostActiveRole.members.size;

    await channel.send(
        `Most active role for the ${hourLabel} ET hour window: **${mostActiveRole.name}** ` +
        `(${messageCount} message${messageCount !== 1 ? 's' : ''} from ${memberCount} member${memberCount !== 1 ? 's' : ''})`
    );
}

const allReportActivityForServer = async (guildId: string, guild: Guild, hourWindow: string) => {
    const trackedRoleIdsValue = configuration.getConfigurationValue(guildId, TrackedRoleIdsConfigurationKey);
    const channelId = configuration.getConfigurationValue(guildId, RoleActivityChannelIdConfigurationKey);

    if (!trackedRoleIdsValue || !channelId) return;

    const trackedRoleIds = trackedRoleIdsValue.split(',').map(id => id.trim()).filter(Boolean);
    if (trackedRoleIds.length === 0) return;

    const counts = db.getRoleMessageCountsForWindow(guildId, hourWindow);
    const countMap = new Map(counts.map(row => [row.RoleId, row.Count]));

    if (guild.members.cache.size < guild.memberCount) {
        await guild.members.fetch();
    }

    const activityMap = new Map<string, { memberCount: number, messageCount: number, activityRatio: number, roleName: string }>();

    for (const roleId of trackedRoleIds) {
        const role = guild.roles.cache.get(roleId);
        if (!role) continue;

        const memberCount = role.members.size;
        if (memberCount === 0) continue;

        const messageCount = countMap.get(roleId) ?? 0;
        const activity = messageCount / memberCount;

        activityMap.set(roleId, {
            memberCount: memberCount,
            messageCount: messageCount,
            activityRatio: activity,
            roleName: role.name
        });
    }

    const channel = guild.channels.cache.get(channelId) as TextChannel | undefined;
    if (!channel) return;

    const windowDate = new Date(hourWindow);
    const hourLabel = windowDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });

    const sorted = [...activityMap.entries()].sort((a, b) => b[1].activityRatio - a[1].activityRatio);

    const lines = sorted.map(([, { roleName, messageCount, memberCount, activityRatio }]) =>
        `**${roleName}**: ${messageCount} message${messageCount !== 1 ? 's' : ''} from ${memberCount} members => ${activityRatio.toFixed(2)} activity ratio`
    );

    await channel.send(
        `Role activity for the ${hourLabel} ET hour window:\n${blockQuote(lines.join('\n'))}`
    );
}

export const runRoleActivityHourlyJob = async (client: Client) => {
    for (const [guildId, guild] of client.guilds.cache) {
        const featureFlagEnabled = featureFlags.getFeatureFlag(guildId, RoleActivityReportingFeatureFlag);
        if (!featureFlagEnabled)
            continue;
        await reportActivityForServer(guildId, guild, getPreviousHourWindow());
    }
}

export const allRoleActivity = async (client: Client, guildId: string) => {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;
    await allReportActivityForServer(guildId, guild, getHourWindowForDate(new Date()))
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
