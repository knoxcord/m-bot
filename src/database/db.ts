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

            CREATE TABLE IF NOT EXISTS RoleMessageCounts (
                GuildId TEXT NOT NULL,
                RoleId TEXT NOT NULL,
                HourWindow TEXT NOT NULL,
                Count INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (GuildId, RoleId, HourWindow)
            );

            CREATE TABLE IF NOT EXISTS UserRoleMessageCounts (
                GuildId TEXT NOT NULL,
                RoleId TEXT NOT NULL,
                UserId TEXT NOT NULL,
                HourWindow TEXT NOT NULL,
                Count INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (GuildId, RoleId, UserId, HourWindow)
            );

            CREATE TABLE IF NOT EXISTS FeatureFlags (
                GuildId TEXT NOT NULL,
                Key TEXT NOT NULL,
                Enabled INTEGER NOT NULL DEFAULT 0,
                SetByUserId TEXT NOT NULL,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (GuildId, Key)
            );

            CREATE TABLE IF NOT EXISTS ScoreSubmissions (
                GuildId TEXT NOT NULL,
                UserId TEXT NOT NULL,
                Score INTEGER NOT NULL,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (GuildId, UserId)
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

    incrementRoleMessageCount(guildId: string, roleId: string, hourWindow: string) {
        const statement = this.db.prepare(`
            INSERT INTO RoleMessageCounts (GuildId, RoleId, HourWindow, Count)
            VALUES (?, ?, ?, 1)
            ON CONFLICT (GuildId, RoleId, HourWindow) DO UPDATE SET Count = Count + 1
        `);
        return statement.run(guildId, roleId, hourWindow);
    }

    incrementUserRoleMessageCount(guildId: string, roleId: string, userId: string, hourWindow: string) {
        const statement = this.db.prepare(`
            INSERT INTO UserRoleMessageCounts (GuildId, RoleId, UserId, HourWindow, Count)
            VALUES (?, ?, ?, ?, 1)
            ON CONFLICT (GuildId, RoleId, UserId, HourWindow) DO UPDATE SET Count = Count + 1
        `);
        return statement.run(guildId, roleId, userId, hourWindow);
    }

    getRoleMessageCountsForWindow(guildId: string, hourWindow: string) {
        const statement = this.db.prepare(`
            SELECT RoleId, Count FROM RoleMessageCounts WHERE GuildId = ? AND HourWindow = ?
        `);
        return statement.all(guildId, hourWindow) as { RoleId: string, Count: number }[];
    }

    getTopUserForRoleInWindow(guildId: string, roleId: string, hourWindow: string) {
        const statement = this.db.prepare(`
            SELECT UserId, Count FROM UserRoleMessageCounts
            WHERE GuildId = ? AND RoleId = ? AND HourWindow = ?
            ORDER BY Count DESC
            LIMIT 1
        `);
        return statement.get(guildId, roleId, hourWindow) as { UserId: string, Count: number } | undefined;
    }

    getTopUsersForWindow(guildId: string, hourWindow: string, limit: number = 10) {
        const statement = this.db.prepare(`
            SELECT UserId, RoleId, Count FROM UserRoleMessageCounts
            WHERE GuildId = ? AND HourWindow = ?
            ORDER BY Count DESC
            LIMIT ?
        `);
        return statement.all(guildId, hourWindow, limit) as { UserId: string, RoleId: string, Count: number }[];
    }

    saveScoreSubmission(guildId: string, userId: string, score: number) {
        const statement = this.db.prepare(`
            INSERT OR REPLACE INTO ScoreSubmissions (GuildId, UserId, Score)
            VALUES (?, ?, ?)
        `);
        return statement.run(guildId, userId, score);
    }

    getScoreSubmissionForUser(guildId: string, userId: string) {
        const statement = this.db.prepare(`
            SELECT Score, CreatedAt FROM ScoreSubmissions WHERE UserId = ? AND GuildId = ?
        `);
        return statement.get(userId, guildId) as { Score: number, CreatedAt: string };
    }

    deleteScoreSubmission(guildId: string, userId: string) {
        const statement = this.db.prepare(`
            DELETE FROM ScoreSubmissions WHERE GuildId = ? AND UserId = ?
        `);
        return statement.run(guildId, userId);
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

    /** This should only be accessed by the feature flags class */
    setFeatureFlag(guildId: string, key: string, enabled: boolean, userId: string) {
        const statement = this.db.prepare(`
            INSERT OR REPLACE INTO FeatureFlags (GuildId, Key, Enabled, SetByUserId)
            VALUES (?, ?, ?, ?)
        `)
        return statement.run(guildId, key, enabled ? 1 : 0, userId);
    }

    /** This should only be accessed by the feature flags class */
    getFeatureFlag(guildId: string, key: string) {
        const statement = this.db.prepare(`
            SELECT Enabled FROM FeatureFlags WHERE GuildId = ? AND Key = ?
        `)
        const result = statement.get(guildId, key) as { Enabled: number } | undefined;
        return result ? result.Enabled === 1 : null;
    }

    /** This should only be accessed by the feature flags class */
    getAllFeatureFlags() {
        const statement = this.db.prepare(`
            SELECT GuildId, Key, Enabled FROM FeatureFlags
        `)
        const result = statement.all() as { GuildId: string, Key: string, Enabled: number }[] | undefined;
        return result ? result : null;
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