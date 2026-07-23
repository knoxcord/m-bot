import { afterEach, describe, it, mock } from "node:test";
import { strict as assert } from "node:assert";
import type { TopicWeightingRow } from "../../database/types.ts";
import type { ResolvedWeightConfig} from "./topicWeights.ts";
import { computeWeight, pickWeighted, TopicWeightDefaults } from "./topicWeights.ts";

const NOW = new Date("2026-01-01T12:00:00Z");

const hoursAgo = (hours: number) => {
    const d = new Date(NOW.getTime() - hours * 60 * 60 * 1000);
    return d.toISOString().slice(0, 19).replace("T", " ");
};

const baseRow = (overrides: Partial<TopicWeightingRow> = {}): TopicWeightingRow => ({
    Id: 1,
    AddedByUserId: "user-a",
    LastShownAt: null,
    Upvotes: 0,
    Downvotes: 0,
    ...overrides,
});

const config: ResolvedWeightConfig = { ...TopicWeightDefaults };

const closeTo = (actual: number, expected: number, epsilon = 1e-9) => {
    assert.ok(
        Math.abs(actual - expected) < epsilon,
        `expected ${actual} to be close to ${expected}`,
    );
};

describe("computeWeight: recency", () => {
    it("never-shown topic has multiplier 1", () => {
        assert.equal(computeWeight(baseRow(), { now: NOW }), 1);
    });

    it("just-shown topic clamps to recency floor", () => {
        const w = computeWeight(baseRow({ LastShownAt: hoursAgo(0.1) }), { now: NOW });
        closeTo(w, config.recencyFloor);
    });

    it("shown halfway through the window is half-weight", () => {
        const w = computeWeight(baseRow({ LastShownAt: hoursAgo(config.recencyWindowHours / 2) }), { now: NOW });
        closeTo(w, 0.5);
    });

    it("shown beyond the window saturates at 1", () => {
        const w = computeWeight(baseRow({ LastShownAt: hoursAgo(config.recencyWindowHours * 10) }), { now: NOW });
        assert.equal(w, 1);
    });

    it("topic shown within the cooldown window has weight 0", () => {
        const cooldownConfig = { ...config, recencyCooldownHours: 24 };
        const w = computeWeight(baseRow({ LastShownAt: hoursAgo(12) }), { now: NOW, config: cooldownConfig });
        assert.equal(w, 0);
    });

    it("recency ramp starts only after the cooldown ends", () => {
        const cooldownConfig = { ...config, recencyCooldownHours: 24 };
        // Halfway through the window, measured from the end of cooldown.
        const w = computeWeight(
            baseRow({ LastShownAt: hoursAgo(cooldownConfig.recencyCooldownHours + cooldownConfig.recencyWindowHours / 2) }),
            { now: NOW, config: cooldownConfig },
        );
        closeTo(w, 0.5);
    });

    it("topic just past the cooldown is at the recency floor, not mid-ramp", () => {
        const cooldownConfig = { ...config, recencyCooldownHours: 24 };
        const w = computeWeight(
            baseRow({ LastShownAt: hoursAgo(cooldownConfig.recencyCooldownHours + 0.1) }),
            { now: NOW, config: cooldownConfig },
        );
        closeTo(w, config.recencyFloor);
    });

    it("cooldown of 0 disables the hard cooldown", () => {
        const w = computeWeight(baseRow({ LastShownAt: hoursAgo(0.1) }), { now: NOW, config });
        closeTo(w, config.recencyFloor);
    });
});

describe("computeWeight: author", () => {
    it("does not penalize when no preloadedUserId is supplied", () => {
        assert.equal(computeWeight(baseRow(), { now: NOW }), 1);
    });

    it("penalizes a row whose author matches preloadedUserId", () => {
        const w = computeWeight(baseRow({ AddedByUserId: "preloader" }), { now: NOW, preloadedUserId: "preloader" });
        closeTo(w, config.preloadedUserMultiplier);
    });

    it("does not penalize rows from other authors", () => {
        const w = computeWeight(baseRow({ AddedByUserId: "user-a" }), { now: NOW, preloadedUserId: "preloader" });
        assert.equal(w, 1);
    });
});

describe("computeWeight: votes", () => {
    it("zero net votes leaves multiplier at 1", () => {
        assert.equal(computeWeight(baseRow(), { now: NOW }), 1);
    });

    it("net positive votes scale weight up by step", () => {
        const w = computeWeight(baseRow({ Upvotes: 3 }), { now: NOW });
        closeTo(w, 1 + 3 * config.voteStep);
    });

    it("clamps massive net positive votes to ceiling", () => {
        const w = computeWeight(baseRow({ Upvotes: 1000 }), { now: NOW });
        assert.equal(w, config.voteCeiling);
    });

    it("clamps massive net negative votes to floor", () => {
        const w = computeWeight(baseRow({ Downvotes: 1000 }), { now: NOW });
        closeTo(w, config.voteFloor);
    });
});

describe("computeWeight: composition", () => {
    it("multiplies recency, author, and vote factors together", () => {
        const row = baseRow({
            AddedByUserId: "preloader",
            LastShownAt: hoursAgo(config.recencyWindowHours / 2),
            Upvotes: 2,
        });
        const w = computeWeight(row, { now: NOW, preloadedUserId: "preloader" });
        const expected = 0.5 * config.preloadedUserMultiplier * (1 + 2 * config.voteStep);
        closeTo(w, expected);
    });
});

describe("pickWeighted", () => {
    afterEach(() => mock.restoreAll());

    it("returns undefined for empty input", () => {
        assert.equal(pickWeighted([]), undefined);
    });

    it("returns the only row when input has one element", () => {
        const row = baseRow();
        assert.equal(pickWeighted([row]), row);
    });

    it("respects the weighted CDF: low random selects the heavier first row", () => {
        mock.method(Math, "random", () => 0.0);
        const heavy = baseRow({ Id: 1 });
        const light = baseRow({ Id: 2, Downvotes: 100 });
        assert.equal(pickWeighted([heavy, light]), heavy);
    });

    it("respects the weighted CDF: high random selects the trailing row", () => {
        mock.method(Math, "random", () => 0.9999);
        const heavy = baseRow({ Id: 1 });
        const light = baseRow({ Id: 2, Downvotes: 100 });
        assert.equal(pickWeighted([heavy, light]), light);
    });

    it("never selects a topic inside its cooldown window", () => {
        mock.method(Math, "random", () => 0.0);
        const cooldownConfig = { ...config, recencyCooldownHours: 24 };
        const cooled = baseRow({ Id: 1, LastShownAt: hoursAgo(1) });
        const eligible = baseRow({ Id: 2 });
        assert.equal(pickWeighted([cooled, eligible], { now: NOW, config: cooldownConfig }), eligible);
    });

    it("returns undefined when every topic is in cooldown", () => {
        const cooldownConfig = { ...config, recencyCooldownHours: 24 };
        const cooledA = baseRow({ Id: 1, LastShownAt: hoursAgo(1) });
        const cooledB = baseRow({ Id: 2, LastShownAt: hoursAgo(2) });
        assert.equal(pickWeighted([cooledA, cooledB], { now: NOW, config: cooldownConfig }), undefined);
    });
});
