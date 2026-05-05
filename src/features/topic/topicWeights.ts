import type { TopicWeightingRow } from "../../database/db.ts";

export const TopicWeightDefaults = {
    recencyWindowHours: 168,
    recencyFloor: 0.05,
    preloadedUserMultiplier: 0.3,
    voteStep: 0.1,
    voteFloor: 0.1,
    voteCeiling: 5,
} as const;

export interface ResolvedWeightConfig {
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

const recencyMultiplier = (lastShownAt: string | null, now: Date, windowHours: number, floor: number) => {
    if (!lastShownAt) return 1;
    const shownMs = new Date(`${lastShownAt}Z`).getTime();
    const hoursSince = (now.getTime() - shownMs) / (1000 * 60 * 60);
    return clamp(hoursSince / windowHours, floor, 1);
};

const authorMultiplier = (addedByUserId: string, preloadedUserId: string | null | undefined, multiplier: number) =>
    preloadedUserId && addedByUserId === preloadedUserId ? multiplier : 1;

const voteMultiplier = (upvotes: number, downvotes: number, step: number, floor: number, ceiling: number) =>
    clamp(1 + step * (upvotes - downvotes), floor, ceiling);

export const computeWeight = (row: TopicWeightingRow, options: WeightOptions = {}) => {
    const now = options.now ?? new Date();
    const config = options.config ?? { ...TopicWeightDefaults };
    return (
        recencyMultiplier(row.LastShownAt, now, config.recencyWindowHours, config.recencyFloor)
        * authorMultiplier(row.AddedByUserId, options.preloadedUserId, config.preloadedUserMultiplier)
        * voteMultiplier(row.Upvotes, row.Downvotes, config.voteStep, config.voteFloor, config.voteCeiling)
    );
};

export const pickWeighted = (rows: TopicWeightingRow[], options: WeightOptions = {}): TopicWeightingRow | undefined => {
    if (rows.length === 0) return undefined;

    const weights = rows.map(row => computeWeight(row, options));
    const total = weights.reduce((sum, w) => sum + w, 0);
    if (total <= 0) return rows[Math.floor(Math.random() * rows.length)];

    let target = Math.random() * total;
    for (let i = 0; i < rows.length; i++) {
        target -= weights[i];
        if (target <= 0) return rows[i];
    }
    return rows[rows.length - 1];
};
