import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { getUtcMinutesOfDay, isWithinDailyWindow, parseHhMmToMinutes } from "./quietHours.ts";

describe("parseHhMmToMinutes", () => {
    it("parses a typical time", () => {
        assert.equal(parseHhMmToMinutes("09:30"), 9 * 60 + 30);
    });

    it("parses midnight", () => {
        assert.equal(parseHhMmToMinutes("00:00"), 0);
    });

    it("parses end-of-day", () => {
        assert.equal(parseHhMmToMinutes("23:59"), 23 * 60 + 59);
    });

    it("accepts single-digit hour", () => {
        assert.equal(parseHhMmToMinutes("9:30"), 9 * 60 + 30);
    });

    it("rejects hours above 23", () => {
        assert.equal(parseHhMmToMinutes("24:00"), undefined);
    });

    it("rejects minutes above 59", () => {
        assert.equal(parseHhMmToMinutes("12:60"), undefined);
    });

    it("rejects single-digit minutes", () => {
        assert.equal(parseHhMmToMinutes("12:5"), undefined);
    });

    it("rejects non-numeric input", () => {
        assert.equal(parseHhMmToMinutes("ab:cd"), undefined);
    });

    it("rejects empty string", () => {
        assert.equal(parseHhMmToMinutes(""), undefined);
    });

    it("rejects trailing whitespace", () => {
        assert.equal(parseHhMmToMinutes("12:30 "), undefined);
    });

    it("rejects bare hour", () => {
        assert.equal(parseHhMmToMinutes("12"), undefined);
    });
});

describe("isWithinDailyWindow: non-wrapping (start < end)", () => {
    const start = 9 * 60;  // 09:00
    const end = 17 * 60;   // 17:00

    it("is true at the start boundary (inclusive)", () => {
        assert.equal(isWithinDailyWindow(start, start, end), true);
    });

    it("is false at the end boundary (exclusive)", () => {
        assert.equal(isWithinDailyWindow(end, start, end), false);
    });

    it("is true mid-window", () => {
        assert.equal(isWithinDailyWindow(12 * 60, start, end), true);
    });

    it("is false before the window", () => {
        assert.equal(isWithinDailyWindow(8 * 60, start, end), false);
    });

    it("is false after the window", () => {
        assert.equal(isWithinDailyWindow(18 * 60, start, end), false);
    });
});

describe("isWithinDailyWindow: wrapping (start > end)", () => {
    const start = 22 * 60;  // 22:00
    const end = 8 * 60;     // 08:00

    it("is true at the start boundary (inclusive)", () => {
        assert.equal(isWithinDailyWindow(start, start, end), true);
    });

    it("is false at the end boundary (exclusive)", () => {
        assert.equal(isWithinDailyWindow(end, start, end), false);
    });

    it("is true late at night before midnight", () => {
        assert.equal(isWithinDailyWindow(23 * 60, start, end), true);
    });

    it("is true after midnight before end", () => {
        assert.equal(isWithinDailyWindow(3 * 60, start, end), true);
    });

    it("is false in the middle of the day", () => {
        assert.equal(isWithinDailyWindow(12 * 60, start, end), false);
    });

    it("is false right before start", () => {
        assert.equal(isWithinDailyWindow(start - 1, start, end), false);
    });
});

describe("isWithinDailyWindow: zero-width (start === end)", () => {
    it("is always false even at the boundary", () => {
        assert.equal(isWithinDailyWindow(12 * 60, 12 * 60, 12 * 60), false);
    });

    it("is false at other times", () => {
        assert.equal(isWithinDailyWindow(0, 12 * 60, 12 * 60), false);
    });
});

describe("getUtcMinutesOfDay", () => {
    it("returns 0 at UTC midnight", () => {
        assert.equal(getUtcMinutesOfDay(new Date("2026-01-01T00:00:00Z")), 0);
    });

    it("returns minutes-since-midnight for a typical UTC time", () => {
        assert.equal(getUtcMinutesOfDay(new Date("2026-01-01T09:30:00Z")), 9 * 60 + 30);
    });

    it("ignores local timezone offsets", () => {
        // Same UTC instant regardless of how it's expressed
        assert.equal(getUtcMinutesOfDay(new Date("2026-01-01T05:30:00-04:00")), 9 * 60 + 30);
    });

    it("returns 23:59 minute value at end-of-day UTC", () => {
        assert.equal(getUtcMinutesOfDay(new Date("2026-01-01T23:59:00Z")), 23 * 60 + 59);
    });
});
