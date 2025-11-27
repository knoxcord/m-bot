import { bold, ContainerBuilder, inlineCode, strikethrough, subtext } from "discord.js"
import { DiceRollResult, RollAccentColors, RollDefinition } from "./rollTypes.js"

const getKeepDropString = (rollDefinition: RollDefinition) => {
    if (rollDefinition.keepHighest)
        return `, keep highest ${rollDefinition.keepHighest}`;

    if (rollDefinition.keepLowest)
        return `, keep lowest ${rollDefinition.keepLowest}`;

    let dropString = "";
    if (rollDefinition.dropHighest)
        dropString = `${dropString}, drop highest ${rollDefinition.dropHighest}`;
    if (rollDefinition.dropLowest)
        dropString = `${dropString}, drop lowest ${rollDefinition.dropLowest}`;

    return dropString;
}

const getAmountChangeString = (amountChange: number | undefined) => {
    if (!amountChange) return "";

    const operator = amountChange > 0 ? "add" : "subtract";
    return `, ${operator} ${Math.abs(amountChange)}`;
}

const getShortAmountChangeString = (amountChange: number | undefined) => {
    if (!amountChange) return "";

    const operator = amountChange > 0 ? "+" : "-";
    return ` ${operator} ${Math.abs(amountChange)}`;
}

const getInputString = (rollDefinition: RollDefinition, notation: string | undefined) => {
    const rollString = `roll ${rollDefinition.numberOfDice} ${rollDefinition.numberOfDice === 1 ? "die" : "dice"}`;
    const sidesString = ` having ${rollDefinition.numberOfSides} ${rollDefinition.numberOfSides === 1 ? "side" : `sides${rollDefinition.numberOfDice > 1 ? " each" : ""}`}`;
    const keepDropString = getKeepDropString(rollDefinition);
    const amountChangeString = getAmountChangeString(rollDefinition.amountChange);
    const definitionString = [rollString, sidesString, keepDropString, amountChangeString].join("");
    
    return `Given input: ${notation ? `${inlineCode(notation.trim())} (${definitionString})` : definitionString}`;
}

interface IMinMax {
    minimum: number,
    maximum: number
};

const calculateRollMinMax = (rollDefinitions: RollDefinition[]): IMinMax => rollDefinitions.reduce((acc, current) => {
    let numberOfDice = current.numberOfDice
    if (current.keepHighest)
        numberOfDice = current.keepHighest;
    else if (current.keepLowest)
        numberOfDice = current.keepLowest;
    else
        numberOfDice -= (current.dropHighest ?? 0) + (current.dropLowest ?? 0);

    const amountChange = current.amountChange ?? 0;
    acc.minimum += numberOfDice + amountChange;
    acc.maximum += (numberOfDice * current.numberOfSides) + amountChange;
    return acc;
}, <IMinMax>{ minimum: 0, maximum: 0 });

export const buildResponse = (rollResults: DiceRollResult[], rollDefinitions: RollDefinition[], notations: string[] | undefined) => {
    const rollsTotal = rollResults.reduce((acc, current) => acc + current.sum, 0);
    const rollMinMax = calculateRollMinMax(rollDefinitions);

    let accentColor = RollAccentColors.Default;
    let resultDecorator = "";
    if (rollsTotal === rollMinMax.maximum) {
        accentColor = RollAccentColors.NatHigh;
        resultDecorator = "  :tada:";
    } else if (rollsTotal === rollMinMax.minimum) {
        accentColor = RollAccentColors.NatLow;
        resultDecorator = "  :skull:";
    }

    const container = new ContainerBuilder()
	.setAccentColor(accentColor)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`# Roll Result: ${rollsTotal}${resultDecorator}`),
        textDisplay => textDisplay.setContent(subtext(`Min: ${rollMinMax.minimum}, Max: ${rollMinMax.maximum}`)),
    )

    rollResults.forEach((rollResult, index) => {
        if (index > 0)
            container.addSeparatorComponents(separator => separator);

        const rollDefinition = rollDefinitions[index];
        const notation = notations?.[index];
        const inputString = getInputString(rollDefinition, notation)
        const dieResults = rollResult.dieRollResults
            .map(dieResult => dieResult.isDropped ? strikethrough(dieResult.number.toString()) : bold(dieResult.number.toString()))
            .join(", ");

        container.addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`Rolled: [${dieResults}]${getShortAmountChangeString(rollDefinition.amountChange)} = ${bold(rollResult.sum.toString())}`),
            textDisplay => textDisplay.setContent(subtext(inputString)),
        )
    });

    return container;
}
