import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { CommandKey, ISlashCommand } from "./commandTypes.js";
import { parseNotatedRolls } from "../../features/roll/lexer.js";
import { RollDefinition, RollSeparator } from "../../features/roll/rollTypes.js";
import { getErrorResult, getSuccessResult, Result } from "../../models/result.js";
import { doRoll } from "../../features/roll/roll.js";
import { buildResponse } from "../../features/roll/builders.js";
import { assertValidDefinition, MaxNumberOfDice, MaxNumberOfSides, MinNumberOfDice, MinNumberOfSides } from "../../features/roll/validators.js";

const Key = CommandKey.Roll
const Description = "Roll dice";

enum FieldNameEnum {
    Notation = "notation",
    Number = "number",
    Sides = "sides",
    DropLowest = "drop-lowest",
    DropHighest = "drop-highest",
    KeepLowest = "keep-lowest",
    KeepHighest = "keep-highest",
    Add = "add",
    Subtract = "subtract"
}

const builder = new SlashCommandBuilder()
    .setName(Key)
    .setDescription(Description)
    .addStringOption(stringOption => stringOption.setName(FieldNameEnum.Notation).setDescription("Accepts dice roll notation (ex: 4d6d1+10, 3d8kh2-4). All other options are ignored when you use this").setRequired(false))
    .addIntegerOption(integerOption => integerOption.setName(FieldNameEnum.Number).setDescription("Number of dice to roll").setMinValue(MinNumberOfDice).setMaxValue(MaxNumberOfDice).setRequired(false))
    .addIntegerOption(integerOption => integerOption.setName(FieldNameEnum.Sides).setDescription("Number sides per die").setMinValue(MinNumberOfSides).setMaxValue(MaxNumberOfSides).setRequired(false))
    .addIntegerOption(integerOption => integerOption.setName(FieldNameEnum.DropLowest).setDescription("Drops given number of lowest rolled dice").setMinValue(0).setRequired(false))
    .addIntegerOption(integerOption => integerOption.setName(FieldNameEnum.DropHighest).setDescription("Drops given number of highest rolled dice").setMinValue(0).setRequired(false))
    .addIntegerOption(integerOption => integerOption.setName(FieldNameEnum.KeepLowest).setDescription("Keeps given number of lowest rolled dice. Drops are ignored when use is used").setMinValue(0).setRequired(false))
    .addIntegerOption(integerOption => integerOption.setName(FieldNameEnum.KeepHighest).setDescription("Keeps given number of highest rolled dice. Drops are ignored when this is used").setMinValue(0).setRequired(false))
    .addIntegerOption(integerOption => integerOption.setName(FieldNameEnum.Add).setDescription("Adds given number to dice result").setMinValue(0).setRequired(false))
    .addIntegerOption(integerOption => integerOption.setName(FieldNameEnum.Subtract).setDescription("Subtracts given number from dice result").setMinValue(0).setRequired(false))
    ;


const getOptions = (interaction: ChatInputCommandInteraction): Result<RollDefinition[]> => {
    const addAmount = interaction.options.getInteger(FieldNameEnum.Add) ?? 0;
    const subtractAmount = interaction.options.getInteger(FieldNameEnum.Subtract) ?? 0;

    const roll: RollDefinition = {
        numberOfDice: interaction.options.getInteger(FieldNameEnum.Number) ?? 1,
        numberOfSides: interaction.options.getInteger(FieldNameEnum.Sides) ?? 20,
        // Null coalesce to undefined here to prevent NaNs
        keepHighest: interaction.options.getInteger(FieldNameEnum.KeepHighest) ?? undefined,
        keepLowest: interaction.options.getInteger(FieldNameEnum.KeepLowest) ?? undefined,
        dropHighest: interaction.options.getInteger(FieldNameEnum.DropHighest) ?? undefined,
        dropLowest: interaction.options.getInteger(FieldNameEnum.DropLowest) ?? undefined,
        amountChange: addAmount - subtractAmount
    };

    const validationError = assertValidDefinition(roll);
    if (validationError)
        getErrorResult(validationError);

    return getSuccessResult([roll]);
}

const handler = async (interaction: ChatInputCommandInteraction) => {
    let reply = "roll";

    const notationString = interaction.options.getString(FieldNameEnum.Notation);
    const notations = notationString?.split(RollSeparator);
    const rollDefinitions = notations ? parseNotatedRolls(notations) : getOptions(interaction);
    
    if (!rollDefinitions.success) {
        reply = rollDefinitions.errorMessage;
        await interaction.reply({
            content: reply,
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    const rollResults = rollDefinitions.data.map(doRoll);
    const components = buildResponse(rollResults, rollDefinitions.data, notations);
    await interaction.reply({
        components: [components],
        flags: MessageFlags.IsComponentsV2
    });
}

export const Roll: ISlashCommand = {
    builder: builder,
    handler: handler,
    key: Key
}