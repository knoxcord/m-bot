import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { CommandKey, ICommand } from "./commandTypes.js";

const Key = CommandKey.Ping
const Description = "Replies with pong";

const builder = new SlashCommandBuilder().setName(Key).setDescription(Description);

const handler = async (interaction: ChatInputCommandInteraction) =>
    await interaction.reply("pong");

export const Ping: ICommand = {
    builder: builder,
    handler: handler,
    key: Key
}