// eslint-disable-next-line import-x/no-named-as-default
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DbPath = '../../data/sqlite.db';

export interface LocationRow {
    Id: number;
    GuildId: string;
    Name: string;
    Address: string | null;
    Description: string | null;
    Keywords: string | null;
    Hours: string | null;
    Url: string | null;
    AddedByUserId: string;
    CreatedAt: string;
}

export interface LocationImageRow {
    Id: number;
    LocationId: number;
    ImageUrl: string;
    AddedByUserId: string;
    CreatedAt: string;
}

export interface TopicRow {
    Id: number;
    GuildId: string;
    Topic: string;
    AddedByUserId: string;
    CreatedAt: string;
    LastShownAt: string | null;
    ShownCount: number;
}

export interface TopicWithVotesRow extends TopicRow {
    Upvotes: number;
    Downvotes: number;
}

export interface TopicWeightingRow {
    Id: number;
    AddedByUserId: string;
    LastShownAt: string | null;
    Upvotes: number;
    Downvotes: number;
}

export enum TopicVote {
    Up = 0,
    Down = 1,
}

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

            CREATE TABLE IF NOT EXISTS RouletteStats (
                GuildId TEXT NOT NULL,
                UserId TEXT NOT NULL,
                Invocations INTEGER NOT NULL DEFAULT 0,
                Hits INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (GuildId, UserId)
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

            CREATE TABLE IF NOT EXISTS Locations (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                GuildId TEXT NOT NULL,
                Name TEXT NOT NULL,
                Address TEXT,
                Description TEXT,
                Keywords TEXT,
                Hours TEXT,
                Url TEXT,
                AddedByUserId TEXT NOT NULL,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (GuildId, Name)
            );

            CREATE TABLE IF NOT EXISTS LocationImages (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                LocationId INTEGER NOT NULL,
                ImageUrl TEXT NOT NULL,
                AddedByUserId TEXT NOT NULL,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (LocationId) REFERENCES Locations(Id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS Topics (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                GuildId TEXT NOT NULL,
                Topic Text NOT NULL,
                AddedByUserId TEXT NOT NULL,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS TopicVotes (
                TopicId INTEGER NOT NULL,
                UserId TEXT NOT NULL,
                Vote INTEGER NOT NULL,
                PRIMARY KEY (TopicId, UserId)
            );
        `)

        this.addColumnIfMissing('Topics', 'LastShownAt', 'DATETIME');
        this.addColumnIfMissing('Topics', 'ShownCount', 'INTEGER NOT NULL DEFAULT 0');
    }

    private addColumnIfMissing(table: string, column: string, definition: string) {
        const columns = this.db.pragma(`table_info(${table})`) as { name: string }[];
        if (columns.some(c => c.name === column)) return;
        this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
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

    recordRouletteShot(guildId: string, userId: string, didHit: boolean) {
        const hitIncrement = didHit ? 1 : 0;
        const statement = this.db.prepare(`
            INSERT INTO RouletteStats (GuildId, UserId, Invocations, Hits)
            VALUES (?, ?, 1, ?)
            ON CONFLICT (GuildId, UserId) DO UPDATE SET
                Invocations = Invocations + 1,
                Hits = Hits + ?
        `);
        return statement.run(guildId, userId, hitIncrement, hitIncrement);
    }

    getRouletteStatsForUser(guildId: string, userId: string) {
        const statement = this.db.prepare(`
            SELECT Invocations, Hits FROM RouletteStats WHERE GuildId = ? AND UserId = ?
        `);
        const result = statement.get(guildId, userId) as { Invocations: number, Hits: number } | undefined;
        return result ?? { Invocations: 0, Hits: 0 };
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

    // Location methods

    addLocation(guildId: string, name: string, addedByUserId: string, address?: string, description?: string, keywords?: string, hours?: string, url?: string) {
        const statement = this.db.prepare(`
            INSERT INTO Locations (GuildId, Name, Address, Description, Keywords, Hours, Url, AddedByUserId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return statement.run(guildId, name, address ?? null, description ?? null, keywords ?? null, hours ?? null, url ?? null, addedByUserId);
    }

    getLocation(guildId: string, name: string) {
        const statement = this.db.prepare(`
            SELECT * FROM Locations WHERE GuildId = ? AND Name = ?
        `);
        return statement.get(guildId, name) as LocationRow | undefined;
    }

    getAllLocations(guildId: string) {
        const statement = this.db.prepare(`
            SELECT * FROM Locations WHERE GuildId = ? ORDER BY Name ASC
        `);
        return statement.all(guildId) as LocationRow[];
    }

    searchLocations(guildId: string, query: string) {
        const searchTerm = `%${query}%`;
        const statement = this.db.prepare(`
            SELECT * FROM Locations WHERE GuildId = ? AND (Name LIKE ? OR Keywords LIKE ? OR Address LIKE ? OR Description LIKE ?)
            ORDER BY Name ASC
            LIMIT 25
        `);
        return statement.all(guildId, searchTerm, searchTerm, searchTerm, searchTerm) as LocationRow[];
    }

    updateLocation(guildId: string, currentName: string, name?: string, address?: string | null, description?: string | null, keywords?: string | null, hours?: string | null, url?: string | null) {
        const location = this.getLocation(guildId, currentName);
        if (!location) return;

        const statement = this.db.prepare(`
            UPDATE Locations
            SET Name = ?, Address = ?, Description = ?, Keywords = ?, Hours = ?, Url = ?
            WHERE GuildId = ? AND Name = ?
        `);
        return statement.run(
            name ?? location.Name,
            address !== undefined ? address : location.Address,
            description !== undefined ? description : location.Description,
            keywords !== undefined ? keywords : location.Keywords,
            hours !== undefined ? hours : location.Hours,
            url !== undefined ? url : location.Url,
            guildId,
            currentName
        );
    }

    removeLocation(guildId: string, name: string) {
        const statement = this.db.prepare(`
            DELETE FROM Locations WHERE GuildId = ? AND Name = ?
        `);
        return statement.run(guildId, name);
    }

    addLocationImage(locationId: number, imageUrl: string, addedByUserId: string) {
        const statement = this.db.prepare(`
            INSERT INTO LocationImages (LocationId, ImageUrl, AddedByUserId)
            VALUES (?, ?, ?)
        `);
        return statement.run(locationId, imageUrl, addedByUserId);
    }

    getLocationImages(locationId: number) {
        const statement = this.db.prepare(`
            SELECT * FROM LocationImages WHERE LocationId = ?
        `);
        return statement.all(locationId) as LocationImageRow[];
    }

    removeLocationImage(imageId: number) {
        const statement = this.db.prepare(`
            DELETE FROM LocationImages WHERE Id = ?
        `);
        return statement.run(imageId);
    }

    searchTopics(guildId: string, query: string) {
        const searchTerm = `%${query}%`;
        const statement = this.db.prepare(`
            SELECT Id, GuildId, Topic, AddedByUserId, CreatedAt, LastShownAt, ShownCount
            FROM Topics WHERE GuildId = ? AND (Topic LIKE ?)
            ORDER BY CreatedAt DESC
            LIMIT 25
        `);
        return statement.all(guildId, searchTerm) as TopicRow[];
    }

    getTopic(guildId: string, topicId: number) {
        const statement = this.db.prepare(`
            SELECT
                t.Id, t.GuildId, t.Topic, t.AddedByUserId, t.CreatedAt, t.LastShownAt, t.ShownCount,
                COALESCE(SUM(CASE WHEN v.Vote = ${TopicVote.Up} THEN 1 ELSE 0 END), 0) AS Upvotes,
                COALESCE(SUM(CASE WHEN v.Vote = ${TopicVote.Down} THEN 1 ELSE 0 END), 0) AS Downvotes
            FROM Topics t
            LEFT JOIN TopicVotes v ON v.TopicId = t.Id
            WHERE t.GuildId = ? AND t.Id = ?
            GROUP BY t.Id
        `);
        return statement.get(guildId, topicId) as TopicWithVotesRow | undefined;
    }

    getRecentTopics(guildId: string) {
        const statement = this.db.prepare(`
            SELECT Id, GuildId, Topic, AddedByUserId, CreatedAt, LastShownAt, ShownCount
            FROM Topics WHERE GuildId = ?
            ORDER BY CreatedAt DESC
            LIMIT 25;
        `);
        return statement.all(guildId) as TopicRow[];
    }

    /** Atomically picks a random topic, increments ShownCount, sets LastShownAt, and returns the updated row. */
    pickRandomTopicAndMarkShown(guildId: string) {
        const statement = this.db.prepare(`
            UPDATE Topics
            SET LastShownAt = CURRENT_TIMESTAMP, ShownCount = ShownCount + 1
            WHERE Id = (SELECT Id FROM Topics WHERE GuildId = ? ORDER BY RANDOM() LIMIT 1)
            RETURNING Id, GuildId, Topic, AddedByUserId, CreatedAt, LastShownAt, ShownCount
        `);
        return statement.get(guildId) as TopicRow | undefined;
    }

    getTopicsForWeighting(guildId: string) {
        const statement = this.db.prepare(`
            SELECT
                t.Id, t.AddedByUserId, t.LastShownAt,
                COALESCE(SUM(CASE WHEN v.Vote = ${TopicVote.Up} THEN 1 ELSE 0 END), 0) AS Upvotes,
                COALESCE(SUM(CASE WHEN v.Vote = ${TopicVote.Down} THEN 1 ELSE 0 END), 0) AS Downvotes
            FROM Topics t
            LEFT JOIN TopicVotes v ON v.TopicId = t.Id
            WHERE t.GuildId = ?
            GROUP BY t.Id
        `);
        return statement.all(guildId) as TopicWeightingRow[];
    }

    getTopicVoteCounts(topicId: number) {
        const statement = this.db.prepare(`
            SELECT
                COALESCE(SUM(CASE WHEN Vote = ${TopicVote.Up} THEN 1 ELSE 0 END), 0) AS Upvotes,
                COALESCE(SUM(CASE WHEN Vote = ${TopicVote.Down} THEN 1 ELSE 0 END), 0) AS Downvotes
            FROM TopicVotes WHERE TopicId = ?
        `);
        return statement.get(topicId) as { Upvotes: number, Downvotes: number };
    }

    /** Toggles off if the user already voted this direction, otherwise sets/swaps the vote. */
    applyTopicVote(topicId: number, userId: string, clicked: TopicVote) {
        const getCurrent = this.db.prepare(`
            SELECT Vote FROM TopicVotes WHERE TopicId = ? AND UserId = ?
        `);
        const clearVote = this.db.prepare(`
            DELETE FROM TopicVotes WHERE TopicId = ? AND UserId = ?
        `);
        const upsertVote = this.db.prepare(`
            INSERT INTO TopicVotes (TopicId, UserId, Vote) VALUES (?, ?, ?)
            ON CONFLICT (TopicId, UserId) DO UPDATE SET Vote = excluded.Vote
        `);

        const txn = this.db.transaction(() => {
            const current = getCurrent.get(topicId, userId) as { Vote: number } | undefined;
            if (current?.Vote === clicked) {
                clearVote.run(topicId, userId);
            } else {
                upsertVote.run(topicId, userId, clicked);
            }
        });
        txn();
        return this.getTopicVoteCounts(topicId);
    }

    /** Increments ShownCount, sets LastShownAt for the given topic, and returns the updated row with vote counts. */
    markTopicShownAndReturn(guildId: string, topicId: number) {
        const statement = this.db.prepare(`
            UPDATE Topics
            SET LastShownAt = CURRENT_TIMESTAMP, ShownCount = ShownCount + 1
            WHERE GuildId = ? AND Id = ?
            RETURNING Id, GuildId, Topic, AddedByUserId, CreatedAt, LastShownAt, ShownCount
        `);
        const txn = this.db.transaction(() => {
            const row = statement.get(guildId, topicId) as TopicRow | undefined;
            if (!row) return undefined;
            return { ...row, ...this.getTopicVoteCounts(row.Id) };
        });
        return txn();
    }

    addTopic(guildId: string, topic: string, userId: string) {
        const statement = this.db.prepare(`
            INSERT INTO Topics (GuildId, Topic, AddedByUserId)
            VALUES (?, ?, ?)
        `)
        statement.run(guildId, topic, userId);
    }

    removeTopic(guildId: string, topicId: number) {
        const statement = this.db.prepare(`
            DELETE FROM Topics WHERE GuildId = ? AND Id = ?;
        `);
        statement.run(guildId, topicId);
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