import type { TopicWeightingRow } from "../../database/types.ts";

export const TopicWeightDefaults = {
    recencyCooldownHours: 0,
    recencyWindowHours: 168,
    recencyFloor: 0.05,
    preloadedUserMultiplier: 0.3,
    voteStep: 0.1,
    voteFloor: 0.1,
    voteCeiling: 5,
} as const;

export interface ResolvedWeightConfig {
    recencyCooldownHours: number;
    recencyWindowHours: number;
    recencyFloor: number;
    preloadedUserMultiplier: number;
    voteStep: number;
    voteFloor: number;
    voteCeiling: number;
}

export interface WeightOptions {
    preloadedUserId?: string | null;
    now?: Date;
    config?: ResolvedWeightConfig;
}

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const recencyMultiplier = (lastShownAt: string | null, now: Date, cooldownHours: number, windowHours: number, floor: number) => {
    if (!lastShownAt) return 1;
    const shownMs = new Date(`${lastShownAt}Z`).getTime();
    const hoursSince = (now.getTime() - shownMs) / (1000 * 60 * 60);
    // Hard cooldown: a topic shown within this window is never eligible.
    if (cooldownHours > 0 && hoursSince < cooldownHours) return 0;
    // The recency bias ramp starts only once the cooldown has ended.
    const hoursSinceCooldownEnded = hoursSince - cooldownHours;
    return clamp(hoursSinceCooldownEnded / windowHours, floor, 1);
};

const authorMultiplier = (addedByUserId: string, preloadedUserId: string | null | undefined, multiplier: number) =>
    preloadedUserId && addedByUserId === preloadedUserId ? multiplier : 1;

const voteMultiplier = (upvotes: number, downvotes: number, step: number, floor: number, ceiling: number) =>
    clamp(1 + step * (upvotes - downvotes), floor, ceiling);

export interface WeightBreakdown {
    recency: number;
    author: number;
    vote: number;
    total: number;
}

export const computeWeightBreakdown = (row: TopicWeightingRow, options: WeightOptions = {}): WeightBreakdown => {
    const now = options.now ?? new Date();
    const config = options.config ?? { ...TopicWeightDefaults };
    const recency = recencyMultiplier(row.LastShownAt, now, config.recencyCooldownHours, config.recencyWindowHours, config.recencyFloor);
    const author = authorMultiplier(row.AddedByUserId, options.preloadedUserId, config.preloadedUserMultiplier);
    const vote = voteMultiplier(row.Upvotes, row.Downvotes, config.voteStep, config.voteFloor, config.voteCeiling);
    return { recency, author, vote, total: recency * author * vote };
};

export const computeWeight = (row: TopicWeightingRow, options: WeightOptions = {}) =>
    computeWeightBreakdown(row, options).total;

export const pickWeighted = (rows: TopicWeightingRow[], options: WeightOptions = {}): TopicWeightingRow | undefined => {
    if (rows.length === 0) return undefined;

    // Drop zero-weight rows (e.g. topics inside their cooldown window) so they
    // can never be selected, even via the all-zero fallback below.
    const eligible = rows
        .map(row => ({ row, weight: computeWeight(row, options) }))
        .filter(entry => entry.weight > 0);
    if (eligible.length === 0) return undefined;

    const total = eligible.reduce((sum, entry) => sum + entry.weight, 0);

    let target = Math.random() * total;
    for (const entry of eligible) {
        target -= entry.weight;
        if (target <= 0) return entry.row;
    }
    return eligible[eligible.length - 1].row;
};
