import { Result } from "../../models/result.js"
import { getLexorResultError, getLexorResultSuccess, RollDefinition } from "./rollTypes.js"
import { assertValidDefinition } from "./validators.js"

enum CapturingGroupEnum {
    NumberOfDice = "numberOfDice",
    NumberOfSides = "numberOfSides",
    OnlyNumberOfSides = "onlyNumberOfSides",
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

const diceRegex = /^(?<numberOfDice>\d+)?d(?<numberOfSides>\d+)(?<additionalFunctions>.*)|(?<onlyNumberOfSides>\d+)(?!d)/;
const plusOrMinusRegex = /.*(?<plusOrMinusType>[+-])(?<plusOrMinusNumber>\d+)?/;

// No named capture groups on these because there can be multiple
const dropKeepRegex = /(d|dl|dh|k|kl|kh)(\d+)/g;

const parseDropKeep = (additionalFunctions: string) => {
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
const parseRoll = (rollString: string): Result<RollDefinition> => {
    const parseResult = rollString.trim().match(diceRegex)?.groups ?? {};

    const parsedNumberOfDice = parseInt(parseResult[CapturingGroupEnum.NumberOfDice], 10);
    const parsedNumberOfSides = parseInt(parseResult[CapturingGroupEnum.NumberOfSides], 10);

    // This capturing group exists because someone may enter just "-roll 20" meaning roll 1d20
    const parsedOnlyNumberOfSides = parseInt(parseResult[CapturingGroupEnum.OnlyNumberOfSides], 10);

    if (!parsedNumberOfDice && !parsedNumberOfSides && !parsedOnlyNumberOfSides)
        return getLexorResultError("Bad roll format");

    // Use || here to coalesce NaN
    const roll: RollDefinition = {
        numberOfDice: parsedNumberOfDice || 1,
        numberOfSides: parsedNumberOfSides || parsedOnlyNumberOfSides
    };

    const additionalFunctions = parseResult[CapturingGroupEnum.AdditionalFunctions];
    if (additionalFunctions) {
        const dropKeepResult = parseDropKeep(additionalFunctions);
        roll.keepHighest = dropKeepResult?.keepHighest;
        roll.keepLowest = dropKeepResult?.keepLowest;
        roll.dropLowest = dropKeepResult?.dropLowest;
        roll.dropHighest = dropKeepResult?.dropHighest;
        roll.amountChange = parsePlusOrMinus(additionalFunctions);
    }

    const validationError = assertValidDefinition(roll);
    if (validationError)
        return getLexorResultError(validationError);

    return getLexorResultSuccess(roll);
}

export const parseNotatedRolls = (rollStrings: string[]): Result<RollDefinition[]> => {
    const rollResults = rollStrings.map(parseRoll);

    if (rollResults.every(result => result.success))
        return {
            success: true,
            data: rollResults.map(result => result.data)
        }

    return {
        success: false,
        errorMessage: rollResults.find(rollResult => !rollResult.success)?.errorMessage ?? "Unexpected error occurred"
    }
}