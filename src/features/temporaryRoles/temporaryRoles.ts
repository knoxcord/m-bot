import type { Client, GuildMember } from "discord.js";
import db from "../../database/db.js";

const getAssignmentKey = (guildId: string, userId: string, roleId: string) => `${guildId}:${userId}:${roleId}`;
const pendingTimeouts = new Map<string, NodeJS.Timeout>();

const removeTemporaryRole = async (guildId: string, userId: string, roleId: string, member: GuildMember) => {
    try {
        await member.roles.remove(roleId);
    } catch (error) {
        console.warn(`Failed to remove temporary role ${roleId} from user ${userId} in guild ${guildId}: ${error}`);
    } finally {
        db.deleteTemporaryRoleAssignment(guildId, userId, roleId);
        pendingTimeouts.delete(getAssignmentKey(guildId, userId, roleId));
    }
}

const scheduleRemoval = (guildId: string, userId: string, roleId: string, member: GuildMember, delayMs: number) => {
    const key = getAssignmentKey(guildId, userId, roleId);
    const existing = pendingTimeouts.get(key);
    if (existing) clearTimeout(existing);
    const timeout = setTimeout(() => removeTemporaryRole(guildId, userId, roleId, member), delayMs);
    pendingTimeouts.set(key, timeout);
}

export const scheduleTemporaryRole = (member: GuildMember, roleId: string, durationSeconds: number) => {
    const guildId = member.guild.id;
    const userId = member.id;
    const expiresAt = Date.now() + durationSeconds * 1000;

    // TODO: This just replaces, should we do a more intelligent update using whatever expiresAt is larger?
    db.saveTemporaryRoleAssignment(guildId, userId, roleId, expiresAt);
    scheduleRemoval(guildId, userId, roleId, member, durationSeconds * 1000);
}

export const cancelTemporaryRole = async (member: GuildMember, roleId: string) => {
    const guildId = member.guild.id;
    const userId = member.id;
    const key = getAssignmentKey(guildId, userId, roleId);
    const existing = pendingTimeouts.get(key);
    if (!existing)
        return false;

    clearTimeout(existing);
    pendingTimeouts.delete(key);
    await removeTemporaryRole(guildId, userId, roleId, member);
    return true;
}

export const restoreTemporaryRoles = async (client: Client) => {
    const assignments = db.getAllTemporaryRoleAssignments();
    if (assignments.length === 0) return;

    console.info(`Restoring ${assignments.length} temporary role assignment(s)`);

    for (const assignment of assignments) {
        const guild = client.guilds.cache.get(assignment.GuildId);
        if (!guild) {
            console.warn(`Guild ${assignment.GuildId} not found while restoring temporary role for user ${assignment.UserId}; dropping record`);
            db.deleteTemporaryRoleAssignment(assignment.GuildId, assignment.UserId, assignment.RoleId);
            continue;
        }

        let member: GuildMember;
        try {
            member = await guild.members.fetch(assignment.UserId);
        } catch (error) {
            console.warn(`Failed to fetch member ${assignment.UserId} in guild ${assignment.GuildId} while restoring temporary role; dropping record: ${error}`);
            db.deleteTemporaryRoleAssignment(assignment.GuildId, assignment.UserId, assignment.RoleId);
            continue;
        }

        const remainingMs = assignment.ExpiresAt - Date.now();
        if (remainingMs <= 0) {
            await removeTemporaryRole(assignment.GuildId, assignment.UserId, assignment.RoleId, member);
            continue;
        }

        scheduleRemoval(assignment.GuildId, assignment.UserId, assignment.RoleId, member, remainingMs);
    }
}
