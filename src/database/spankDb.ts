import { databaseManager } from "./databaseManager.js";

export const saveSpank = (messageId: string, guildId: string, spanker: string, spankee: string, reason: string) => {
    const db = databaseManager.getDatabase();
    const statement = db.prepare(`
        INSERT OR REPLACE INTO Spanks (MessageId, GuildId, SpankerUserId, SpankeeUserId, Reason)
        VALUES (?, ?, ?, ?, ?)
    `);
    return statement.run(messageId, guildId, spanker, spankee, reason);
}

export const getSpankCountForSpankee = (spankeeUserId: string, guildId: string) => {
    const db = databaseManager.getDatabase();
    const statement = db.prepare(`
        SELECT COUNT(*) as totalSpanks FROM Spanks WHERE SpankeeUserId = ? AND GuildId = ?
    `)
    const result = statement.get(spankeeUserId, guildId) as { totalSpanks: number } | undefined;
    return result ? result.totalSpanks : null;
}

export const getRecentSpankReasonsForSpankee = (spankeeUserId: string, guildId: string, limit: number) => {
    const db = databaseManager.getDatabase();
    const statement = db.prepare(`
        SELECT Reason, CreatedAt FROM Spanks WHERE SpankeeUserId = ? AND GuildId = ? ORDER BY CreatedAt DESC LIMIT ?;
    `);
    const result = statement.all(spankeeUserId, guildId, limit) as { Reason: string, CreatedAt: string }[] | undefined;
    return result ? result : null;
}