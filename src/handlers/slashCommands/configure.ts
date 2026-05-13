import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction, ChatInputCommandInteraction} from "discord.js";
import { inlineCode, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import type { ISlashCommand } from "./commandTypes.ts";
import { CommandKey } from "./commandTypes.ts";
import type { ConfigurationRegistration } from "../../features/configuration/configurationTypes.ts";
import configuration from "../../features/configuration/configuration.ts";
import { configurationRegistrations } from "../../features/configuration/configurationRegistrations.ts";
import { AutocompleteResultLimit, formatAutocompleteName } from "../../shared/autocompleteOptionFormatter.ts";

const Key = CommandKey.Configure;
const Description = "Gets or sets configuration values";
enum ConfigurationSubcommandEnum {
    Get = 'get',
    Set = 'set',
    Unset = 'unset',
}

const ensureNoDuplicateKeys = (configRegistrations: ConfigurationRegistration[]) => {
    const seen = new Set<string>();
    configRegistrations.forEach(([, key]) => {
        if (seen.has(key))
            throw `Encountered duplicate configuration key: ${key}`;
        seen.add(key);
    })
}

export const getConfigurationCommandBuilder = () => {
    ensureNoDuplicateKeys(configurationRegistrations);

    return new SlashCommandBuilder()
        .setName(Key)
        .setDescription(Description)
        .addSubcommand(subcommand =>
            subcommand
                .setName(ConfigurationSubcommandEnum.Get)
                .setDescription('Get a configuration value')
                .addStringOption(option =>
                    option.setName('field')
                        .setDescription('The configuration field to retrieve')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName(ConfigurationSubcommandEnum.Set)
                .setDescription('Set a configuration value')
                .addStringOption(option =>
                    option.setName('field')
                        .setDescription('The configuration field to set')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('value')
                        .setDescription('The value to set')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName(ConfigurationSubcommandEnum.Unset)
                .setDescription('Clear a configuration value')
                .addStringOption(option =>
                    option.setName('field')
                        .setDescription('The configuration field to clear')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);
}

const handleGet = async (interaction: ChatInputCommandInteraction) => {
    const field = interaction.options.getString('field', true);
    const configVal = configuration.getConfigurationValue(interaction.guildId ?? "", field);
    if (!configVal)
        await interaction.reply(`Field ${inlineCode(field)} is not set`);
    else
        await interaction.reply(`Field ${inlineCode(field)} is set to ${inlineCode(configVal)}`);
}

const handleSet = async (interaction: ChatInputCommandInteraction) => {
    const field = interaction.options.getString('field', true);
    const value = interaction.options.getString('value', true);
    configuration.setConfigurationValue(interaction.guildId ?? "", field, value, interaction.user.id)
    await interaction.reply(`Set field ${inlineCode(field)} to ${inlineCode(value)}`);
}

const handleUnset = async (interaction: ChatInputCommandInteraction) => {
    const field = interaction.options.getString('field', true);
    configuration.unsetConfigurationValue(interaction.guildId ?? "", field);
    await interaction.reply(`Cleared field ${inlineCode(field)}`);
}

const configurationCommandHandler = async (interaction: ChatInputCommandInteraction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === ConfigurationSubcommandEnum.Get) {
        await handleGet(interaction);
    } else if (subcommand === ConfigurationSubcommandEnum.Set) {
        await handleSet(interaction);
    } else if (subcommand === ConfigurationSubcommandEnum.Unset) {
        await handleUnset(interaction);
    }
};

const configurationAutocompleteHandler = async (interaction: AutocompleteInteraction) => {
    const focused = interaction.options.getFocused().toLowerCase();
    const matches = configurationRegistrations
        .filter(([name]) => name.toLowerCase().includes(focused))
        .slice(0, AutocompleteResultLimit);

    await interaction.respond(
        matches.map(([name, key]) => <ApplicationCommandOptionChoiceData<string>>({
            name: formatAutocompleteName(name),
            value: key,
        }))
    );
};

export const Configure: ISlashCommand = {
    builder: getConfigurationCommandBuilder(),
    handler: configurationCommandHandler,
    autocompleteHandler: configurationAutocompleteHandler,
    key: Key
}
