import { ChatInputCommandInteraction, inlineCode } from "discord.js";
import configuration from "./configuration.js";
import { ConfigurationSubcommandEnum } from "./configurationTypes.js";

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

export const configurationCommandHandler = async (interaction: ChatInputCommandInteraction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === ConfigurationSubcommandEnum.Get) {
        await handleGet(interaction);
    } else if (subcommand === ConfigurationSubcommandEnum.Set) {
        await handleSet(interaction);
    }
};