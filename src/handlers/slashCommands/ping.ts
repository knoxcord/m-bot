import type { ChatInputCommandInteraction} from "discord.js";
import { SlashCommandBuilder } from "discord.js";
import type { ISlashCommand } from "./commandTypes.ts";
import { CommandKey } from "./commandTypes.ts";

const Key = CommandKey.Ping
const Description = "Replies with pong";

const builder = new SlashCommandBuilder().setName(Key).setDescription(Description);

const handler = async (interaction: ChatInputCommandInteraction) =>
    await interaction.reply("pong");

export const Ping: ISlashCommand = {
    builder: builder,
    handler: handler,
    key: Key
}