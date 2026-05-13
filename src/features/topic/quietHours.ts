const HHMM_PATTERN = /^(\d{1,2}):(\d{2})$/;

/** Parses an "HH:MM" string (24h) into minutes-since-midnight, or undefined if malformed. */
export const parseHhMmToMinutes = (raw: string): number | undefined => {
    const match = raw.match(HHMM_PATTERN);
    if (!match) return undefined;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return undefined;
    return hours * 60 + minutes;
};

/**
 * Returns true if `nowMinutes` falls in the half-open window [start, end).
 * Wraps midnight when `start > end`. Returns false for a zero-width window (start === end).
 */
export const isWithinDailyWindow = (nowMinutes: number, startMinutes: number, endMinutes: number): boolean => {
    if (startMinutes === endMinutes) return false;
    return startMinutes < endMinutes
        ? nowMinutes >= startMinutes && nowMinutes < endMinutes
        : nowMinutes >= startMinutes || nowMinutes < endMinutes;
};

/** Returns UTC minutes-since-midnight for the given Date. */
export const getUtcMinutesOfDay = (date: Date): number =>
    date.getUTCHours() * 60 + date.getUTCMinutes();
