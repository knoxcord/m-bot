import { RollDefinition } from "./rollTypes.js";

export const assertValidDefinition = (rollDefinition: RollDefinition): string | undefined => {
    const isOutOfRange = (input: number | undefined) => input && input > rollDefinition.numberOfDice;

    if (isOutOfRange(rollDefinition.keepHighest))
        return "Keep-Highest number is greater than number of dice"

    if (isOutOfRange(rollDefinition.keepLowest))
        return "Keep-Lowest number is greater than number of dice"

    if (isOutOfRange(rollDefinition.dropLowest))
        return "Drop-Lowest number is greater than number of dice"

    if (isOutOfRange(rollDefinition.dropHighest))
        return "Drop-Highest number is greater than number of dice"
}
