import { APIApplicationCommandOptionChoice, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { ConfigurationCommandKey, ConfigurationRegistration, ConfigurationSubcommandEnum } from "./configurationTypes.js";
import { configurationRegistrations } from "./configurationRegistrations.js";

// This slash command is defined here because it needs to access definitions for other slash commands

const Description = "Gets or sets configuration values";

const getConfigurationKeyChoices = (configRegistrations: ConfigurationRegistration[]) =>
    configRegistrations.map(([key, name]) => (<APIApplicationCommandOptionChoice<string>>{
        name: key,
        value: name
    }));

const ensureNoDuplicateKeys = (configRegistrations: ConfigurationRegistration[]) => {
    const keys = new Set<string>();
    configRegistrations.forEach(([key, _]) => {
        if (keys.has(key))
            throw "Encountered duplicate configuration key";
    })
}

export const getConfigurationCommandBuilder = () => {
    const configKeyChoices = getConfigurationKeyChoices(configurationRegistrations);
    ensureNoDuplicateKeys(configurationRegistrations);

    return new SlashCommandBuilder()
        .setName(ConfigurationCommandKey)
        .setDescription(Description)
        .addSubcommand(subcommand =>
            subcommand
                .setName(ConfigurationSubcommandEnum.Get)
                .setDescription('Get a configuration value')
                .addStringOption(option =>
                    option.setName('field')
                        .setDescription('The configuration field to retrieve')
                        .setRequired(true)
                        .addChoices(configKeyChoices)))
        .addSubcommand(subcommand =>
            subcommand
                .setName(ConfigurationSubcommandEnum.Set)
                .setDescription('Set a configuration value')
                .addStringOption(option =>
                    option.setName('field')
                        .setDescription('The configuration field to set')
                        .setRequired(true)
                        .addChoices(configKeyChoices))
                .addStringOption(option =>
                    option.setName('value')
                        .setDescription('The value to set')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);
}
