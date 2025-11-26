import { getLexorResultError, getLexorResultSuccess, IRoll, LexorResult, ParseRollsResult, RollSeparator } from "./rollTypes.js"

enum CapturingGroupEnum {
    NumberOfDice = "numberOfDice",
    NumberOfSides = "numberOfSides",
    AdditionalFunctions = "additionalFunctions",
    PlusOrMinusType = "plusOrMinusType",
    PlusOrMinusNumber = "plusOrMinusNumber"
}

interface IDropKeep {
    dropLowest?: number
    dropHighest?: number
    keepLowest?: number
    keepHighest?: number
}

const diceRegex = /^(?<numberOfDice>\d+)d(?<numberOfSides>\d+)(?<additionalFunctions>.*)/;
const plusOrMinusRegex = /.*(?<plusOrMinusType>[+-])(?<plusOrMinusNumber>\d+)?/;

// No named capture groups on these because there can be multiple
const dropKeepRegex = /(d|dl|dh|k|kl|kh)(\d+)/g;

const parseDropKeep = (additionalFunctions: string) => {
    // Drop highest N and drop lowest N can be used together
    // Keep highest N and keep lowest N are exclusive, so we'll check for any of those first
    const dropKeeps = additionalFunctions.match(dropKeepRegex);
    if (!dropKeeps) return undefined;

    const parseDropKeepInt = (keys: string[]) => {
        let found: string | undefined;

        keys.forEach(key => {
            found = dropKeeps.find(match => match.startsWith(key))?.slice(key.length) ?? found
        });

        if (!found) return undefined
        return parseInt(found, 10) || undefined;
    }

    const dropKeepResult: IDropKeep = {
        dropLowest: parseDropKeepInt(["d", "dl"]),
        dropHighest: parseDropKeepInt(["dh"]),
        keepLowest: parseDropKeepInt(["kl"]),
        keepHighest: parseDropKeepInt(["k", "kh"])
    };
    return dropKeepResult;
}

const parsePlusOrMinus = (additionalFunctions: string) => {
    const plusOrMinusRegexResult = additionalFunctions.match(plusOrMinusRegex)?.groups;
    const operator = plusOrMinusRegexResult?.[CapturingGroupEnum.PlusOrMinusType];
    const amount = plusOrMinusRegexResult?.[CapturingGroupEnum.PlusOrMinusNumber];

    if (!operator || !amount) return 0

    const isNegative = operator === "-";
    const amountInt = parseInt(amount, 10) || 0;

    return isNegative ? -amountInt : amountInt;
}

/*
 * Roll format is based on: https://help.roll20.net/hc/en-us/articles/360037773133-Dice-Reference#DiceReference-HowtoRollDice
 * 
 * The supported format is as follows, with parenthesis indicating optional:
 * [number of dice]d[sides per die]([drop/keep indicator][number of dice to drop/keep])
 */
const parseRoll = (rollString: string): LexorResult => {
    const parseResult = rollString.match(diceRegex)?.groups ?? {};

    const numberOfDice = parseInt(parseResult[CapturingGroupEnum.NumberOfDice], 10);
    if (!numberOfDice)
        return getLexorResultError("Missing number of dice");
    
    const numberOfSides = parseInt(parseResult[CapturingGroupEnum.NumberOfSides], 10);
    if (!numberOfSides)
        return getLexorResultError("Missing sides per die");

    const roll: IRoll = {
        numberOfDice,
        numberOfSides
    };

    const additionalFunctions = parseResult[CapturingGroupEnum.AdditionalFunctions];
    if (!additionalFunctions)
        return getLexorResultSuccess(roll);

    // KeepHighest and KeepLowest are exclusive and will take higher priority than Drops
    const dropKeepResult = parseDropKeep(additionalFunctions);
    if (dropKeepResult?.keepHighest && dropKeepResult.keepHighest <= numberOfDice) {
        // no need to have separate drop/keep fields, just calculate drops when using keep
        roll.dropLowest = numberOfDice - dropKeepResult.keepHighest;
    } else if (dropKeepResult?.keepLowest && dropKeepResult.keepLowest <= numberOfDice) {
        // no need to have separate drop/keep fields, just calculate drops when using keep
        roll.dropHighest = numberOfDice - dropKeepResult.keepLowest;
    } else {
        roll.dropLowest = dropKeepResult?.dropLowest;
        roll.dropHighest = dropKeepResult?.dropHighest;
    }

    roll.amountChange = parsePlusOrMinus(additionalFunctions);
    return getLexorResultSuccess(roll);
}

export const parseRolls = (rollsString: string): ParseRollsResult => {
    const rollStrings = rollsString.split(RollSeparator);
    const rollResults = rollStrings.map(parseRoll);

    if (rollResults.every(result => result.success))
        return {
            success: true,
            rolls: rollResults.map(result => result.roll)
        }

    return {
        success: false,
        errorMessage: rollResults.find(rollResult => !rollResult.success)?.errorMessage ?? "Unexpected error occurred"
    }
}