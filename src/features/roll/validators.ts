import { RollDefinition } from "./rollTypes.js";

export const MinNumberOfDice = 1;
export const MaxNumberOfDice = 100;
export const MinNumberOfSides = 1;
export const MaxNumberOfSides = 1000000;

export const assertValidDefinition = (rollDefinition: RollDefinition): string | undefined => {
    const isOutOfRange = (input: number | undefined) => input && input > rollDefinition.numberOfDice;

    if (rollDefinition.numberOfDice < MinNumberOfDice || rollDefinition.numberOfDice > MaxNumberOfDice)
        return `Number of dice must be between ${MinNumberOfDice} and ${MaxNumberOfDice} (inclusive)`

    if (rollDefinition.numberOfSides < MinNumberOfSides || rollDefinition.numberOfSides > MaxNumberOfSides)
        return `Number of sides must be between ${MinNumberOfSides} and ${MaxNumberOfSides} (inclusive)`

    if (isOutOfRange(rollDefinition.keepHighest))
        return "Keep-Highest number is greater than number of dice"

    if (isOutOfRange(rollDefinition.keepLowest))
        return "Keep-Lowest number is greater than number of dice"

    if (isOutOfRange(rollDefinition.dropLowest))
        return "Drop-Lowest number is greater than number of dice"

    if (isOutOfRange(rollDefinition.dropHighest))
        return "Drop-Highest number is greater than number of dice"
}
