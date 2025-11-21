import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export const Ping = {
    data: new SlashCommandBuilder().setName('ping').setDescription('Replies with pong'),
    execute: async (interaction: ChatInputCommandInteraction) => await interaction.reply('pong')
}