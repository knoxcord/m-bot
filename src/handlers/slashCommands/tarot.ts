import type { CacheType, ChatInputCommandInteraction} from "discord.js";
import { SlashCommandBuilder } from "discord.js";
import type { ISlashCommand } from "./commandTypes.ts";
import { CommandKey } from "./commandTypes.ts";
import { buildTarotModal } from "../../features/tarot/builders.ts";

const Key = CommandKey.Tarot;
const Description = "Starts a tarot read";

const builder = new SlashCommandBuilder().setName(Key).setDescription(Description);

const handler = async (interaction: ChatInputCommandInteraction<CacheType>) => await interaction.showModal(buildTarotModal());

export const Tarot: ISlashCommand = {
    builder: builder,
    handler: handler,
    key: Key
}