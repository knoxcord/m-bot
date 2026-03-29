import db from "../database/db.js";

type ConfigurationMatrix = Map<string, Map<string, string>>;

class Configuration {
    private configValues: ConfigurationMatrix;

    constructor() {
        this.configValues = this.loadConfiguration();
        console.info("Loaded configuration:\n", this.configValues);
    }

    private loadConfiguration = () =>
        db.getAllConfigurationValues()?.reduce((acc, value) => {
            if (!acc.has(value.GuildId))
                acc.set(value.GuildId, new Map<string, string>());

            acc.get(value.GuildId)!.set(value.Key, value.Value);

            return acc;
        }, new Map<string, Map<string, string>>()) ?? new Map<string, Map<string, string>>();

    getConfigurationValue = (guildId: string, key: string) =>
        this.configValues.get(guildId)?.get(key);

    setConfigurationValue = (guildId: string, key: string, value: string, userId: string) => {
        // Update db
        db.setConfigurationValue(guildId, key, value, userId);

        // Update cache
        if (!this.configValues.has(guildId))
            this.configValues.set(guildId, new Map<string, string>());
        
        this.configValues.get(guildId)?.set(key, value);
        console.info("Updated configuration:\n", this.configValues);
    }
}

export default new Configuration();