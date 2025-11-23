import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { CommandKey, ICommand } from "./commandTypes.js";
import { buildTarotModal } from "../../features/tarot/builders.js";

const Key = CommandKey.Tarot;
const Description = "Starts a tarot read";

const builder = new SlashCommandBuilder().setName(Key).setDescription(Description);

const handler = async (interaction: ChatInputCommandInteraction<CacheType>) => await interaction.showModal(buildTarotModal());

export const Tarot: ICommand = {
    builder: builder,
    handler: handler,
    key: Key
}