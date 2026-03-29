import { APIApplicationCommandOptionChoice, ChatInputCommandInteraction, inlineCode, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { CommandKey, ISlashCommand } from "../handlers/slashCommands/commandTypes.js";
import { ConfigurationRegistration } from "src/configuration/configurationTypes.js";
import { messageComponents } from "../handlers/messageComponents/index.js";
import { prefixCommands } from "../handlers/prefixCommands/index.js";
import { modals } from "../handlers/modals/index.js";
import { slashCommands } from "../handlers/slashCommands/index.js";
import { baseConfigs } from "./baseConfiguration.js";
import configuration from "./configuration.js";

// This slash command is defined here because it needs to access definitions for other slash commands

const Key = CommandKey.Configure
const Description = "Gets or sets configuration values";

enum SubcommandEnum {
    Get = 'get',
    Set = 'set',
}

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

const setupConfigurationSubcommands = (builder: SlashCommandBuilder, configRegistrations: ConfigurationRegistration[]) => {
    const configKeyChoices = getConfigurationKeyChoices(configRegistrations);
    ensureNoDuplicateKeys(configRegistrations);

    builder
        .setName(CommandKey.Configure)
        .setDescription('Get or set configuration values')
        .addSubcommand(subcommand =>
            subcommand
                .setName(SubcommandEnum.Get)
                .setDescription('Get a configuration value')
                .addStringOption(option =>
                    option.setName('field')
                        .setDescription('The configuration field to retrieve')
                        .setRequired(true)
                        .addChoices(configKeyChoices)))
        .addSubcommand(subcommand =>
            subcommand
                .setName(SubcommandEnum.Set)
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

const getAllConfigurationRegistrations = () => {
    const messageComponentConfigs = messageComponents.flatMap(messageComponent => messageComponent.configurationRegistrations);
    const modalConfigs = modals.flatMap(modal => modal.configurationRegistrations);
    const prefixCommandsConfigs = prefixCommands.flatMap(prefixCommand => prefixCommand.configurationRegistrations);
    const slashCommandConfigs = slashCommands.flatMap(slashCommand => slashCommand.configurationRegistrations);

    return [
        ...baseConfigs,
        ...messageComponentConfigs,
        ...modalConfigs,
        ...prefixCommandsConfigs,
        ...slashCommandConfigs,
    ].filter(config => !!config);
}

const builder = new SlashCommandBuilder()
    .setName(Key)
    .setDescription(Description);

setupConfigurationSubcommands(builder, getAllConfigurationRegistrations());

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

const handler = async (interaction: ChatInputCommandInteraction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === SubcommandEnum.Get) {
        await handleGet(interaction);
    } else if (subcommand === SubcommandEnum.Set) {
        await handleSet(interaction);
    }
};

export const ConfigureSlashCommand: ISlashCommand = {
    builder: builder,
    handler: handler,
    key: Key
}