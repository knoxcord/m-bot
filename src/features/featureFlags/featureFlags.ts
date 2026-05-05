import db from "../../database/db.ts";

type FeatureFlagMatrix = Map<string, Map<string, boolean>>;

class FeatureFlags {
    private flagValues: FeatureFlagMatrix;

    constructor() {
        this.flagValues = this.loadFeatureFlags();
        console.info("Loaded feature flags:\n", this.flagValues);
    }

    private loadFeatureFlags = () =>
        db.getAllFeatureFlags()?.reduce((acc, value) => {
            if (!acc.has(value.GuildId))
                acc.set(value.GuildId, new Map<string, boolean>());

            acc.get(value.GuildId)!.set(value.Key, value.Enabled === 1);

            return acc;
        }, new Map<string, Map<string, boolean>>()) ?? new Map<string, Map<string, boolean>>();

    getFeatureFlag = (guildId: string, key: string) =>
        this.flagValues.get(guildId)?.get(key) ?? false;

    setFeatureFlag = (guildId: string, key: string, enabled: boolean, userId: string) => {
        // Update db
        db.setFeatureFlag(guildId, key, enabled, userId);

        // Update cache
        if (!this.flagValues.has(guildId))
            this.flagValues.set(guildId, new Map<string, boolean>());

        this.flagValues.get(guildId)?.set(key, enabled);
        console.info("Updated feature flags:\n", this.flagValues);
    }
}

export default new FeatureFlags();
