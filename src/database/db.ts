// eslint-disable-next-line import-x/no-named-as-default
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from 'url';
import type { TopicIntegrationKey } from "../features/topic/integrations/types.ts";
import type {
    LocationImageRow,
    LocationRow,
    NewsDraftRow,
    SubmissionRow,
    TemporaryRoleAssignmentRow,
    TopicRow,
    TopicWeightingRow,
    TopicWithVotesRow,
} from './types.ts';
import { TopicVote } from './types.ts';
import type { SubmissionType } from "../features/submissionReview/types.ts";
import { SubmissionStatus } from "../features/submissionReview/types.ts";

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

            CREATE TABLE IF NOT EXISTS TemporaryRoleAssignments (
                GuildId TEXT NOT NULL,
                UserId TEXT NOT NULL,
                RoleId TEXT NOT NULL,
                ExpiresAt INTEGER NOT NULL,
                PRIMARY KEY (GuildId, UserId, RoleId)
            );

            CREATE TABLE IF NOT EXISTS Submissions (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                GuildId TEXT NOT NULL,
                SubmittedByUserId TEXT NOT NULL,
                SourceChannelId TEXT NOT NULL,
                SourceMessageId TEXT,
                Type TEXT NOT NULL,
                Status TEXT NOT NULL,
                Payload TEXT NOT NULL,
                ReviewMessageId TEXT,
                ReviewedByUserId TEXT,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                ReviewedAt DATETIME
            );

            CREATE TABLE IF NOT EXISTS NewsDrafts (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                GuildId TEXT NOT NULL,
                AuthorUserId TEXT NOT NULL,
                Valediction TEXT NOT NULL,
                Title TEXT NOT NULL,
                Body TEXT NOT NULL,
                Image BLOB NOT NULL,
                Stationery TEXT,
                SubmittedAt DATETIME,
                SubmissionId INTEGER,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `)

        this.addColumnIfMissing('Topics', 'LastShownAt', 'DATETIME');
        this.addColumnIfMissing('Topics', 'ShownCount', 'INTEGER NOT NULL DEFAULT 0');
        this.addColumnIfMissing('Topics', 'IntegrationKey', 'TEXT');
        this.addColumnIfMissing('Topics', 'DeletedAt', 'DATETIME');
        this.addColumnIfMissing('Topics', 'DeletedByUserId', 'TEXT');
        this.addColumnIfMissing('NewsDrafts', 'Stationery', 'TEXT');
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

    getLocationById(id: number) {
        const statement = this.db.prepare(`
            SELECT Id, GuildId, Name, Address, Description, Keywords, Hours, Url, AddedByUserId, CreatedAt
            FROM Locations WHERE Id = ?
        `);
        return statement.get(id) as LocationRow | undefined;
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

    updateLocationById(id: number, name?: string, address?: string | null, description?: string | null, keywords?: string | null, hours?: string | null, url?: string | null) {
        const location = this.getLocationById(id);
        if (!location) return;

        const statement = this.db.prepare(`
            UPDATE Locations
            SET Name = ?, Address = ?, Description = ?, Keywords = ?, Hours = ?, Url = ?
            WHERE Id = ?
        `);
        return statement.run(
            name ?? location.Name,
            address !== undefined ? address : location.Address,
            description !== undefined ? description : location.Description,
            keywords !== undefined ? keywords : location.Keywords,
            hours !== undefined ? hours : location.Hours,
            url !== undefined ? url : location.Url,
            id
        );
    }

    removeLocationById(id: number) {
        const statement = this.db.prepare(`
            DELETE FROM Locations WHERE Id = ?
        `);
        return statement.run(id);
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
            SELECT Id, GuildId, Topic, AddedByUserId, CreatedAt, LastShownAt, ShownCount, IntegrationKey
            FROM Topics WHERE GuildId = ? AND DeletedAt IS NULL AND (Topic LIKE ?)
            ORDER BY CreatedAt DESC
            LIMIT 25
        `);
        return statement.all(guildId, searchTerm) as TopicRow[];
    }

    getTopic(guildId: string, topicId: number) {
        const statement = this.db.prepare(`
            SELECT
                t.Id, t.GuildId, t.Topic, t.AddedByUserId, t.CreatedAt, t.LastShownAt, t.ShownCount, t.IntegrationKey,
                COALESCE(SUM(CASE WHEN v.Vote = ${TopicVote.Up} THEN 1 ELSE 0 END), 0) AS Upvotes,
                COALESCE(SUM(CASE WHEN v.Vote = ${TopicVote.Down} THEN 1 ELSE 0 END), 0) AS Downvotes
            FROM Topics t
            LEFT JOIN TopicVotes v ON v.TopicId = t.Id
            WHERE t.GuildId = ? AND t.Id = ? AND t.DeletedAt IS NULL
            GROUP BY t.Id
        `);
        return statement.get(guildId, topicId) as TopicWithVotesRow | undefined;
    }

    getRecentTopics(guildId: string) {
        const statement = this.db.prepare(`
            SELECT Id, GuildId, Topic, AddedByUserId, CreatedAt, LastShownAt, ShownCount, IntegrationKey
            FROM Topics WHERE GuildId = ? AND DeletedAt IS NULL
            ORDER BY CreatedAt DESC
            LIMIT 25;
        `);
        return statement.all(guildId) as TopicRow[];
    }

    getTopicsForWeighting(guildId: string) {
        const statement = this.db.prepare(`
            SELECT
                t.Id, t.AddedByUserId, t.LastShownAt,
                COALESCE(SUM(CASE WHEN v.Vote = ${TopicVote.Up} THEN 1 ELSE 0 END), 0) AS Upvotes,
                COALESCE(SUM(CASE WHEN v.Vote = ${TopicVote.Down} THEN 1 ELSE 0 END), 0) AS Downvotes
            FROM Topics t
            LEFT JOIN TopicVotes v ON v.TopicId = t.Id
            WHERE t.GuildId = ? AND t.DeletedAt IS NULL
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
            WHERE GuildId = ? AND Id = ? AND DeletedAt IS NULL
            RETURNING Id, GuildId, Topic, AddedByUserId, CreatedAt, LastShownAt, ShownCount, IntegrationKey
        `);
        const txn = this.db.transaction(() => {
            const row = statement.get(guildId, topicId) as TopicRow | undefined;
            if (!row) return undefined;
            return { ...row, ...this.getTopicVoteCounts(row.Id) };
        });
        return txn();
    }

    /** Clears LastShownAt and decrements ShownCount (floored at 0), returning the updated row with vote counts. */
    resetTopicLastShownAndReturn(guildId: string, topicId: number) {
        const statement = this.db.prepare(`
            UPDATE Topics
            SET LastShownAt = NULL, ShownCount = MAX(ShownCount - 1, 0)
            WHERE GuildId = ? AND Id = ? AND DeletedAt IS NULL
            RETURNING Id, GuildId, Topic, AddedByUserId, CreatedAt, LastShownAt, ShownCount, IntegrationKey
        `);
        const txn = this.db.transaction(() => {
            const row = statement.get(guildId, topicId) as TopicRow | undefined;
            if (!row) return undefined;
            return { ...row, ...this.getTopicVoteCounts(row.Id) };
        });
        return txn();
    }

    addTopic(guildId: string, topic: string, userId: string, integrationKey: TopicIntegrationKey | null = null) {
        const statement = this.db.prepare(`
            INSERT INTO Topics (GuildId, Topic, AddedByUserId, IntegrationKey)
            VALUES (?, ?, ?, ?)
        `)
        const result = statement.run(guildId, topic, userId, integrationKey);
        return Number(result.lastInsertRowid);
    }

    setTopicIntegration(guildId: string, topicId: number, integrationKey: TopicIntegrationKey | null) {
        const statement = this.db.prepare(`
            UPDATE Topics SET IntegrationKey = ? WHERE GuildId = ? AND Id = ?
        `);
        return statement.run(integrationKey, guildId, topicId);
    }

    /** Soft delete: marks the topic deleted (kept for traceability) rather than removing the row. */
    removeTopic(guildId: string, topicId: number, deletedByUserId: string) {
        const statement = this.db.prepare(`
            UPDATE Topics
            SET DeletedAt = CURRENT_TIMESTAMP, DeletedByUserId = ?
            WHERE GuildId = ? AND Id = ? AND DeletedAt IS NULL
        `);
        return statement.run(deletedByUserId, guildId, topicId);
    }

    updateTopicText(guildId: string, topicId: number, topic: string) {
        const statement = this.db.prepare(`
            UPDATE Topics SET Topic = ? WHERE GuildId = ? AND Id = ?
        `);
        return statement.run(topic, guildId, topicId);
    }

    createSubmission(submission: {
        guildId: string;
        sourceChannelId: string;
        sourceMessageId: string | null;
        submittedByUserId: string;
        type: SubmissionType;
        payload: string;
    }) {
        const statement = this.db.prepare(`
            INSERT INTO Submissions
                (GuildId, SourceChannelId, SourceMessageId, SubmittedByUserId, Type, Status, Payload)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = statement.run(
            submission.guildId,
            submission.sourceChannelId,
            submission.sourceMessageId,
            submission.submittedByUserId,
            submission.type,
            SubmissionStatus.Pending,
            submission.payload,
        );
        return Number(result.lastInsertRowid);
    }

    getSubmission(id: number) {
        const statement = this.db.prepare(`
            SELECT
                Id, GuildId, SubmittedByUserId, SourceChannelId, SourceMessageId,
                Type, Status, Payload, ReviewMessageId, ReviewedByUserId, CreatedAt, ReviewedAt
            FROM Submissions WHERE Id = ?
        `);
        return statement.get(id) as SubmissionRow | undefined;
    }

    setSubmissionReviewMessageId(id: number, reviewMessageId: string) {
        const statement = this.db.prepare(`
            UPDATE Submissions SET ReviewMessageId = ? WHERE Id = ?
        `);
        return statement.run(reviewMessageId, id);
    }

    /**
     * Transitions a submission's status, but only if it currently matches expectedStatus.
     * The guard makes the pending→decided transition atomic, so concurrent reviews can't
     * both succeed (changes === 0 means someone else already reviewed it).
     */
    updateSubmissionStatus(id: number, status: SubmissionStatus, reviewedByUserId: string, expectedStatus: SubmissionStatus) {
        const statement = this.db.prepare(`
            UPDATE Submissions
            SET Status = ?, ReviewedByUserId = ?, ReviewedAt = CURRENT_TIMESTAMP
            WHERE Id = ? AND Status = ?
        `);
        return statement.run(status, reviewedByUserId, id, expectedStatus);
    }

    createNewsDraft(draft: {
        guildId: string;
        authorUserId: string;
        valediction: string;
        title: string;
        body: string;
        image: Buffer;
        stationery: string | null;
    }) {
        const statement = this.db.prepare(`
            INSERT INTO NewsDrafts (GuildId, AuthorUserId, Valediction, Title, Body, Image, Stationery)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = statement.run(
            draft.guildId,
            draft.authorUserId,
            draft.valediction,
            draft.title,
            draft.body,
            draft.image,
            draft.stationery,
        );
        return Number(result.lastInsertRowid);
    }

    getNewsDraft(id: number) {
        const statement = this.db.prepare(`
            SELECT Id, GuildId, AuthorUserId, Valediction, Title, Body, Image, Stationery, SubmittedAt, SubmissionId, CreatedAt, UpdatedAt
            FROM NewsDrafts WHERE Id = ?
        `);
        return statement.get(id) as NewsDraftRow | undefined;
    }

    /**
     * Replaces a draft's rendered letter. The valediction is only passed when the sign-off was rerolled.
     * The stationery is always passed since even a reroll of the background needs recording in case
     * stationery was invalid.
     */
    updateNewsDraftRender(id: number, render: { image: Buffer; stationery: string | null; valediction?: string }) {
        const statement = this.db.prepare(`
            UPDATE NewsDrafts
            SET Image = ?, Stationery = ?, Valediction = COALESCE(?, Valediction), UpdatedAt = CURRENT_TIMESTAMP
            WHERE Id = ?
        `);
        return statement.run(render.image, render.stationery, render.valediction ?? null, id);
    }

    /**
     * Marks a draft as being submitted. The SubmittedAt IS NULL guard makes this a one-shot claim,
     * so double-clicking Post can't create two submissions (changes === 0 means someone got there
     * first). The submission itself is created after, then linked with setNewsDraftSubmissionId.
     */
    claimNewsDraftForSubmission(id: number) {
        const statement = this.db.prepare(`
            UPDATE NewsDrafts SET SubmittedAt = CURRENT_TIMESTAMP, UpdatedAt = CURRENT_TIMESTAMP
            WHERE Id = ? AND SubmittedAt IS NULL
        `);
        return statement.run(id);
    }

    /** Releases a claim taken by claimNewsDraftForSubmission when creating the submission failed. */
    releaseNewsDraftClaim(id: number) {
        const statement = this.db.prepare(`
            UPDATE NewsDrafts SET SubmittedAt = NULL, UpdatedAt = CURRENT_TIMESTAMP
            WHERE Id = ? AND SubmissionId IS NULL
        `);
        return statement.run(id);
    }

    setNewsDraftSubmissionId(id: number, submissionId: number) {
        const statement = this.db.prepare(`
            UPDATE NewsDrafts SET SubmissionId = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE Id = ?
        `);
        return statement.run(submissionId, id);
    }

    /**
     * Deletes drafts past the retention window, since each one holds a rendered letter as a blob and
     * abandoned drafts would otherwise accumulate forever.
     *
     * Drafts still awaiting review are exempt at any age: the approval handler reads the image back
     * out to post it, so pruning one out from under a slow moderator would break the post.
     */
    deleteExpiredNewsDrafts(retentionDays: number) {
        const statement = this.db.prepare(`
            DELETE FROM NewsDrafts
            WHERE CreatedAt < datetime('now', ?)
              AND (
                  SubmissionId IS NULL
                  OR SubmissionId IN (SELECT Id FROM Submissions WHERE Status <> ?)
              )
        `);
        return statement.run(`-${retentionDays} days`, SubmissionStatus.Pending);
    }

    saveTemporaryRoleAssignment(guildId: string, userId: string, roleId: string, expiresAt: number) {
        const statement = this.db.prepare(`
            INSERT OR REPLACE INTO TemporaryRoleAssignments (GuildId, UserId, RoleId, ExpiresAt)
            VALUES (?, ?, ?, ?)
        `);
        return statement.run(guildId, userId, roleId, expiresAt);
    }

    deleteTemporaryRoleAssignment(guildId: string, userId: string, roleId: string) {
        const statement = this.db.prepare(`
            DELETE FROM TemporaryRoleAssignments WHERE GuildId = ? AND UserId = ? AND RoleId = ?
        `);
        return statement.run(guildId, userId, roleId);
    }

    getAllTemporaryRoleAssignments() {
        const statement = this.db.prepare(`
            SELECT GuildId, UserId, RoleId, ExpiresAt FROM TemporaryRoleAssignments
        `);
        return statement.all() as TemporaryRoleAssignmentRow[];
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
    deleteConfigurationValue(guildId: string, key: string) {
        const statement = this.db.prepare(`
            DELETE FROM Configuration WHERE GuildId = ? AND Key = ?
        `)
        return statement.run(guildId, key);
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