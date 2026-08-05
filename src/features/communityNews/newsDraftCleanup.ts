import db from "../../database/db.ts";

const NewsDraftRetentionDays = 7;

const CleanupIntervalMs = 24 * 60 * 60 * 1000;

const pruneExpiredNewsDrafts = () => {
    const result = db.deleteExpiredNewsDrafts(NewsDraftRetentionDays);
    if (result.changes > 0)
        console.info(`Pruned ${result.changes} news draft(s) older than ${NewsDraftRetentionDays} days`);
}

export const scheduleNewsDraftCleanup = () => {
    pruneExpiredNewsDrafts();
    setInterval(pruneExpiredNewsDrafts, CleanupIntervalMs);
}
