import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { CommandKey, ICommand } from "./commandTypes.js";
import { parseRolls } from "../../features/roll/lexer.js";

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
    .addIntegerOption(integerOption => integerOption.setName("add").setDescription("Adds given number to dice result").setMinValue(1).setRequired(false))
    .addIntegerOption(integerOption => integerOption.setName("subtract").setDescription("Subtracts given number from dice result").setMinValue(1).setRequired(false))
    ;


const handler = async (interaction: ChatInputCommandInteraction) => {
    console.log(interaction)
    let reply = "roll";

    // TODO: These names should be enums
    const notation = interaction.options.getString("notation");
    if (!notation) {
        await interaction.reply(reply);
        return;
    }

    const rollResult = parseRolls(notation);
    if (!rollResult.success) {
        reply = rollResult.errorMessage;
    } else {
        reply = rollResult.rolls.map(roll => `roll ${roll.numberOfDice} d${roll.numberOfSides}${roll.dropLowest ? " drop lowest " + roll.dropLowest.toString() : ""}${roll.dropHighest ? " drop highest " + roll.dropHighest.toString() : ""}${roll.amountChange ? " add " + roll.amountChange.toString() : ""}`).join(", ")
    }

    await interaction.reply(reply);
}

export const Roll: ICommand = {
    builder: builder,
    handler: handler,
    key: Key
}