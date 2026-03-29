import { APIApplicationCommandOptionChoice, ChatInputCommandInteraction, inlineCode, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { CommandKey, ISlashCommand } from "./commandTypes.js";
import { ConfigurationRegistration } from "../../features/configuration/configurationTypes.js";
import configuration from "../../features/configuration/configuration.js";
import { configurationRegistrations } from "../../features/configuration/configurationRegistrations.js";

const Key = CommandKey.Configure;
const Description = "Gets or sets configuration values";
enum ConfigurationSubcommandEnum {
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

export const getConfigurationCommandBuilder = () => {
    const configKeyChoices = getConfigurationKeyChoices(configurationRegistrations);
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

const configurationCommandHandler = async (interaction: ChatInputCommandInteraction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === ConfigurationSubcommandEnum.Get) {
        await handleGet(interaction);
    } else if (subcommand === ConfigurationSubcommandEnum.Set) {
        await handleSet(interaction);
    }
};

export const Configure: ISlashCommand = {
    builder: getConfigurationCommandBuilder(),
    handler: configurationCommandHandler,
    key: Key
}
