import { APIApplicationCommandOptionChoice, ChatInputCommandInteraction, inlineCode, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { FeatureFlagRegistration } from "../../features/featureFlags/featureFlagTypes.js";
import { featureFlagRegistrations } from "../../features/featureFlags/featureFlagRegistrations.js";
import featureFlags from "../../features/featureFlags/featureFlags.js";
import { CommandKey, ISlashCommand } from "./commandTypes.js";

const Key = CommandKey.Feature;
const Description = "Gets, enables, or disables feature flags";
enum FeatureFlagSubcommandEnum {
    Get = 'get',
    Enable = 'enable',
    Disable = 'disable',
}

const getFeatureFlagKeyChoices = (flagRegistrations: FeatureFlagRegistration[]) =>
    flagRegistrations.map(([key, name]) => (<APIApplicationCommandOptionChoice<string>>{
        name: key,
        value: name
    }));

const ensureNoDuplicateKeys = (flagRegistrations: FeatureFlagRegistration[]) => {
    const keys = new Set<string>();
    flagRegistrations.forEach(([key, _]) => {
        if (keys.has(key))
            throw "Encountered duplicate feature flag key";
    })
}

const getFeatureFlagCommandBuilder = () => {
    const flagKeyChoices = getFeatureFlagKeyChoices(featureFlagRegistrations);
    ensureNoDuplicateKeys(featureFlagRegistrations);

    return new SlashCommandBuilder()
        .setName(Key)
        .setDescription(Description)
        .addSubcommand(subcommand =>
            subcommand
                .setName(FeatureFlagSubcommandEnum.Get)
                .setDescription('Get a feature flag value')
                .addStringOption(option =>
                    option.setName('flag')
                        .setDescription('The feature flag to retrieve')
                        .setRequired(true)
                        .addChoices(flagKeyChoices)))
        .addSubcommand(subcommand =>
            subcommand
                .setName(FeatureFlagSubcommandEnum.Enable)
                .setDescription('Enable a feature flag')
                .addStringOption(option =>
                    option.setName('flag')
                        .setDescription('The feature flag to enable')
                        .setRequired(true)
                        .addChoices(flagKeyChoices)))
        .addSubcommand(subcommand =>
            subcommand
                .setName(FeatureFlagSubcommandEnum.Disable)
                .setDescription('Disable a feature flag')
                .addStringOption(option =>
                    option.setName('flag')
                        .setDescription('The feature flag to disable')
                        .setRequired(true)
                        .addChoices(flagKeyChoices)))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);
}

const handleGet = async (interaction: ChatInputCommandInteraction) => {
    const flag = interaction.options.getString('flag', true);
    const enabled = featureFlags.getFeatureFlag(interaction.guildId ?? "", flag);
    await interaction.reply(`Feature flag ${inlineCode(flag)} is ${enabled ? 'enabled' : 'disabled'}`);
}

const handleEnable = async (interaction: ChatInputCommandInteraction) => {
    const flag = interaction.options.getString('flag', true);
    featureFlags.setFeatureFlag(interaction.guildId ?? "", flag, true, interaction.user.id);
    await interaction.reply(`Enabled feature flag ${inlineCode(flag)}`);
}

const handleDisable = async (interaction: ChatInputCommandInteraction) => {
    const flag = interaction.options.getString('flag', true);
    featureFlags.setFeatureFlag(interaction.guildId ?? "", flag, false, interaction.user.id);
    await interaction.reply(`Disabled feature flag ${inlineCode(flag)}`);
}
const featureFlagCommandHandler = async (interaction: ChatInputCommandInteraction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === FeatureFlagSubcommandEnum.Get) {
        await handleGet(interaction);
    } else if (subcommand === FeatureFlagSubcommandEnum.Enable) {
        await handleEnable(interaction);
    } else if (subcommand === FeatureFlagSubcommandEnum.Disable) {
        await handleDisable(interaction);
    }
};

export const Feature: ISlashCommand = {
    builder: getFeatureFlagCommandBuilder(),
    handler: featureFlagCommandHandler,
    key: Key
}
