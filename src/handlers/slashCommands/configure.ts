import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { CommandKey, ISlashCommand } from "./commandTypes.js";
import configuration from "../../configuration/configuration.js";

const Key = CommandKey.Configure
const Description = "Gets or sets configuration values";

const builder = new SlashCommandBuilder()
    .setName(Key)
    .setDescription(Description);

configuration.setupConfigurationSubcommands(builder);

const handler = async (interaction: ChatInputCommandInteraction) =>
    await interaction.reply("pong");

export const Configure: ISlashCommand = {
    builder: builder,
    handler: handler,
    key: Key
}