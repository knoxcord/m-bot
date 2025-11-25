import { getLexorResultError, getLexorResultSuccess, LexorResult, RollSeparator } from "./rollTypes.js"

enum CapturingGroup {
    NumberOfDice = "numberOfDice",
    SidesPerDie = "sidesPerDie",
    DropKeepType = "dropKeepType",
    DropKeepNumber = "dropKeepNumber",
    PlusOrMinusType = "plusOrMinusType",
    PlusOrMinusNumber = "plusOrMinusNumber"
}

const parseRegex = /(?<numberOfDice>\d+)d(?<sidesPerDie>\d+)(?:(?<dropKeepType><d|k|dl|kh)(?<dropKeepNumber>\d+))?(?:(?<plusOrMinusType>[+-])(?<plusOrMinusAmount>\d+))?/;``
/*
 * Roll format is based on: https://help.roll20.net/hc/en-us/articles/360037773133-Dice-Reference#DiceReference-HowtoRollDice
 * 
 * The supported format is as follows, with parenthesis indicating optional:
 * [number of dice]d[sides per die]([drop/keep indicator][number of dice to drop/keep])
 */
const parseRoll = (rollString: string): LexorResult => {
    const parseResult = rollString.match(parseRegex)?.groups ?? {};
    if (!parseResult['numberOfDice'])
        return getLexorResultError("Missing number of dice");

    if (!parseResult[''])

    const numberOfSides = rollString.

    return getLexorResultSuccess({
        numberOfDice: 0,
        numberOfSides: 0
    });
}

export const parseRolls = (rollsString: string) => {
    const rollStrings = rollsString.split(RollSeparator);
    const rollResults = rollStrings.map(parseRoll);
    if (rollResults.every(result => result.success))
        return rollResults.map(result => result.roll);
    return rollResults.find(rollResult => !rollResult.success)?.errorMessage;
}