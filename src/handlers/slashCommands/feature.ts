import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction, ChatInputCommandInteraction} from "discord.js";
import { inlineCode, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import type { FeatureFlagRegistration } from "../../features/featureFlags/featureFlagTypes.ts";
import { featureFlagRegistrations } from "../../features/featureFlags/featureFlagRegistrations.ts";
import featureFlags from "../../features/featureFlags/featureFlags.ts";
import type { ISlashCommand } from "./commandTypes.ts";
import { CommandKey } from "./commandTypes.ts";
import { AutocompleteResultLimit, formatAutocompleteName } from "../../shared/autocompleteOptionFormatter.ts";

const Key = CommandKey.Feature;
const Description = "Gets, enables, or disables feature flags";
enum FeatureFlagSubcommandEnum {
    Get = 'get',
    Enable = 'enable',
    Disable = 'disable',
}

const ensureNoDuplicateKeys = (flagRegistrations: FeatureFlagRegistration[]) => {
    const seen = new Set<string>();
    flagRegistrations.forEach(([, key]) => {
        if (seen.has(key))
            throw `Encountered duplicate feature flag key: ${key}`;
        seen.add(key);
    })
}

const getFeatureFlagCommandBuilder = () => {
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
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName(FeatureFlagSubcommandEnum.Enable)
                .setDescription('Enable a feature flag')
                .addStringOption(option =>
                    option.setName('flag')
                        .setDescription('The feature flag to enable')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName(FeatureFlagSubcommandEnum.Disable)
                .setDescription('Disable a feature flag')
                .addStringOption(option =>
                    option.setName('flag')
                        .setDescription('The feature flag to disable')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);
}

const knownFeatureFlagKeys = new Set(featureFlagRegistrations.map(([, key]) => key));

const isKnownFlag = async (interaction: ChatInputCommandInteraction, flag: string) => {
    if (knownFeatureFlagKeys.has(flag)) return true;
    await interaction.reply(`Unknown feature flag ${inlineCode(flag)}`);
    return false;
}

const handleGet = async (interaction: ChatInputCommandInteraction) => {
    const flag = interaction.options.getString('flag', true);
    if (!(await isKnownFlag(interaction, flag))) return;
    const enabled = featureFlags.getFeatureFlag(interaction.guildId ?? "", flag);
    await interaction.reply(`Feature flag ${inlineCode(flag)} is ${enabled ? 'enabled' : 'disabled'}`);
}

const handleEnable = async (interaction: ChatInputCommandInteraction) => {
    const flag = interaction.options.getString('flag', true);
    if (!(await isKnownFlag(interaction, flag))) return;
    featureFlags.setFeatureFlag(interaction.guildId ?? "", flag, true, interaction.user.id);
    await interaction.reply(`Enabled feature flag ${inlineCode(flag)}`);
}

const handleDisable = async (interaction: ChatInputCommandInteraction) => {
    const flag = interaction.options.getString('flag', true);
    if (!(await isKnownFlag(interaction, flag))) return;
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

const featureFlagAutocompleteHandler = async (interaction: AutocompleteInteraction) => {
    const focused = interaction.options.getFocused().toLowerCase();
    const matches = featureFlagRegistrations
        .filter(([name]) => name.toLowerCase().includes(focused))
        .slice(0, AutocompleteResultLimit);

    await interaction.respond(
        matches.map(([name, key]) => <ApplicationCommandOptionChoiceData<string>>({
            name: formatAutocompleteName(name),
            value: key,
        }))
    );
};

export const Feature: ISlashCommand = {
    builder: getFeatureFlagCommandBuilder(),
    handler: featureFlagCommandHandler,
    autocompleteHandler: featureFlagAutocompleteHandler,
    key: Key
}
