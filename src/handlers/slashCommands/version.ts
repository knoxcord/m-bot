import type { ChatInputCommandInteraction} from "discord.js";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ISlashCommand } from "./commandTypes.ts";
import { CommandKey } from "./commandTypes.ts";
import packageJson from "../../../package.json" with { type: "json" };

const Key = CommandKey.Version
const Description = "Gets current bot version";

const builder = new SlashCommandBuilder().setName(Key).setDescription(Description);

const handler = async (interaction: ChatInputCommandInteraction) =>
    await interaction.reply({ content: `Version ${packageJson.version}`, flags: MessageFlags.Ephemeral });

export const Version: ISlashCommand = {
    builder: builder,
    handler: handler,
    key: Key
}