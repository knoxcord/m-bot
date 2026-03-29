// eslint-disable-next-line import-x/no-named-as-default
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DbPath = '../../data/sqlite.db';

class DatabaseManager {
    private db: Database.Database;

    constructor() {
        this.db = new Database(path.join(__dirname, DbPath));
        this.initialize();
    }

    private initialize() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS TarotPulls (
                MessageId TEXT PRIMARY KEY,
                UserId TEXT NOT NULL,
                PullResult TEXT NOT NULL,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS Spanks (
                MessageId TEXT PRIMARY KEY,
                GuildId TEXT NOT NULL,
                SpankerUserId TEXT NOT NULL,
                SpankeeUserId TEXT NOT NULL,
                Reason TEXT,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS Awards (
                GuildId TEXT NOT NULL,
                UserId TEXT NOT NULL,
                Award TEXT,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS Configuration (
                GuildId TEXT NOT NULL,
                Key TEXT NOT NULL,
                Value TEXT NOT NULL,
                SetByUserId TEXT NOT NULL,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (GuildId, Key)
            );
        `)
    }

    savePullResult(messageId: string, userId: string, pullResult: string) {
        const statement = this.db.prepare(`
            INSERT OR REPLACE INTO TarotPulls (MessageId, UserId, PullResult)
            VALUES (?, ?, ?)
        `);
        return statement.run(messageId, userId, pullResult);
    }

    getPullResult(messageId: string) {
        const statement = this.db.prepare(`
            SELECT PullResult FROM TarotPulls WHERE MessageId = ?
        `);
        const result = statement.get(messageId) as { PullResult: string } | undefined;
        return result ? result.PullResult : null;
    }

    saveSpank(messageId: string, guildId: string, spanker: string, spankee: string, reason: string) {
        const statement = this.db.prepare(`
            INSERT OR REPLACE INTO Spanks (MessageId, GuildId, SpankerUserId, SpankeeUserId, Reason)
            VALUES (?, ?, ?, ?, ?)
        `);
        return statement.run(messageId, guildId, spanker, spankee, reason);
    }

    getSpankCountForSpankee(spankeeUserId: string, guildId: string) {
        const statement = this.db.prepare(`
            SELECT COUNT(*) as totalSpanks FROM Spanks WHERE SpankeeUserId = ? AND GuildId = ?
        `)
        const result = statement.get(spankeeUserId, guildId) as { totalSpanks: number } | undefined;
        return result ? result.totalSpanks : null;
    }

    getRecentSpankReasonsForSpankee(spankeeUserId: string, guildId: string, limit: number) {
        const statement = this.db.prepare(`
            SELECT Reason, CreatedAt FROM Spanks WHERE SpankeeUserId = ? AND GuildId = ? ORDER BY CreatedAt DESC LIMIT ?;
        `);
        const result = statement.all(spankeeUserId, guildId, limit) as { Reason: string, CreatedAt: string }[] | undefined;
        return result ? result : null;
    }

    getTopSpankees(guildId: string, limit: number) {
    const statement = this.db.prepare(`
        SELECT SpankeeUserId, COUNT(*) as totalSpanks
        FROM Spanks
        WHERE GuildId = ?
        GROUP BY SpankeeUserId
        ORDER BY totalSpanks DESC
        LIMIT ?
    `);
    const result = statement.all(guildId, limit) as { SpankeeUserId: string, totalSpanks: number }[] | undefined;
    return result ? result : [];
}

    saveAward(guildId: string, userId: string, award: string) {
        const statement = this.db.prepare(`
            INSERT OR REPLACE INTO Awards (GuildId, UserId, Award)
            VALUES (?, ?, ?)
        `);
        return statement.run(guildId, userId, award);
    }

    getAwardsForUser(guildId: string, userId: string) {
        const statement = this.db.prepare(`
            SELECT Award, CreatedAt FROM Awards WHERE UserId = ? AND GuildId = ? ORDER BY CreatedAt DESC LIMIT ?;
        `);
        const result = statement.all(userId, guildId) as { Award: string, CreatedAt: string }[] | undefined;
        return result ? result : null;
    }

    /** This should only be accessed by the configuration class */
    setConfigurationValue(guildId: string, key: string, value: string, userId: string) {
        const statement = this.db.prepare(`
            INSERT OR REPLACE INTO Configuration (GuildId, Key, Value, SetByUserId)
            VALUES (?, ?, ?, ?)
        `)
        return statement.run(guildId, key, value, userId);
    }

    /** This should only be accessed by the configuration class */
    getConfigurationValue(guildId: string, key: string) {
        const statement = this.db.prepare(`
            SELECT Value FROM Configuration WHERE GuildId = ? AND Key = ?
        `)
        const result = statement.get(guildId, key) as { Value: string } | undefined;
        return result ? result.Value : null;
    }

    /** This should only be accessed by the configuration class */
    getAllConfigurationValues() {
        const statement = this.db.prepare(`
            SELECT GuildId, Key, Value FROM Configuration
        `)
        const result = statement.all() as { GuildId: string, Key: string, Value: string }[] | undefined;
        return result ? result : null;
    }
}

export default new DatabaseManager();