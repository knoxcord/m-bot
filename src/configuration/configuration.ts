import { APIApplicationCommandOptionChoice, SlashCommandBuilder } from "discord.js";
import db from "../database/db.js";

type ConfigurationMatrix = Map<string, Map<string, string>>;

class Configuration {
    private configRegistrations: Map<string, string>;
    private configValues: ConfigurationMatrix;

    constructor() {
        this.configRegistrations = new Map<string, string>();
        this.configValues = this.loadConfiguration();
    }

    private loadConfiguration = () =>
        db.getAllConfigurationValues()?.reduce((acc, value) => {
            if (!acc.has(value.GuildId))
                acc.set(value.GuildId, new Map<string, string>());

            acc.get(value.GuildId)!.set(value.Key, value.Value);

            return acc;
        }, {} as ConfigurationMatrix) ?? <ConfigurationMatrix>{};

    private getConfigurationKeyChoices = () =>
        this.configRegistrations.entries().map(([key, name]) => (<APIApplicationCommandOptionChoice<string>>{
            name: name,
            value: key
        })).toArray();

    getConfigurationValue = (guildId: string, key: string) =>
        this.configValues.get(guildId)?.get(key);

    setConfigurationValue = (guildId: string, key: string, value: string, userId: string) => {
        // Update db
        db.setConfigurationValue(guildId, key, value, userId);

        // Update cache
        if (!this.configValues.has(guildId))
            this.configValues.set(guildId, new Map<string, string>());
        
        this.configValues.get(guildId)?.set(key, value);
    }

    registerConfigurations = (configs: [key: string, name: string][]) => {
        configs.forEach(([key, name]) => {
            if (this.configRegistrations.has(key))
                throw(`Attempted to register multiple configs with the same key: ${key}, exiting...`);

            console.log(`Registering key: ${key}`)
            this.configRegistrations.set(key, name);
        })
    }

    setupConfigurationSubcommands = (builder: SlashCommandBuilder) => {
        const configurationRegistrations = this.getConfigurationKeyChoices();
        console.log(this.configRegistrations);
        console.log(configurationRegistrations);

        builder
            .setName('configuration')
            .setDescription('Get or set configuration values')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('get')
                    .setDescription('Get a configuration value')
                    .addStringOption(option =>
                        option.setName('field')
                            .setDescription('The configuration field to retrieve')
                            .setRequired(true)
                            .addChoices(configurationRegistrations)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('set')
                    .setDescription('Set a configuration value')
                    .addStringOption(option =>
                        option.setName('field')
                            .setDescription('The configuration field to set')
                            .setRequired(true)
                            .addChoices(configurationRegistrations))
                    .addStringOption(option =>
                        option.setName('value')
                            .setDescription('The value to set')
                            .setRequired(true)));
                    }
}

export default new Configuration();