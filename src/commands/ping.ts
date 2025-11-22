import { ChatInputCommandInteraction, InteractionResponse, SlashCommandBuilder } from "discord.js";
import { ICommand } from "./commandTypes.js";

const Name = "ping";
const Description = "Replies with pong";

const builder = new SlashCommandBuilder().setName(Name).setDescription(Description);

const handler = async (interaction: ChatInputCommandInteraction) =>
    await interaction.reply("pong");

export const Ping: ICommand<ChatInputCommandInteraction, InteractionResponse> = {
    builder: builder,
    handler: handler,
    name: Name
}