import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { CommandKey, ICommand } from "./commandTypes.js";

const Key = CommandKey.Roll
const Description = "Roll dice";

const builder = new SlashCommandBuilder()
    .setName(Key)
    .setDescription(Description)
    .addStringOption(stringOption => stringOption.setName("notation").setDescription("Accepts standard dice roll notation (ex: 4d6+10, 3d8d1). Other options are ignored when you use this").setRequired(false))
    .addIntegerOption(integerOption => integerOption.setName("number").setDescription("Number of dice to roll").setMinValue(1).setRequired(false))
    .addIntegerOption(integerOption => integerOption.setName("sides").setDescription("Number sides per die").setMinValue(1).setRequired(false))
    .addIntegerOption(integerOption => integerOption.setName("drop-lowest").setDescription("Drops given number of lowest rolled dice").setMinValue(1).setRequired(false))
    .addIntegerOption(integerOption => integerOption.setName("drop-highest").setDescription("Drops given number of highest rolled dice").setMinValue(1).setRequired(false))
    ;


const handler = async (interaction: ChatInputCommandInteraction) => {
    await interaction.reply("roll");
}

export const Roll: ICommand = {
    builder: builder,
    handler: handler,
    key: Key
}