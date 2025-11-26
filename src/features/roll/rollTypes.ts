import { Result } from "../../models/result.js";

export const RollSeparator = ",";

export enum DropKeepEnum {
    Drop = "d",
    Keep = "k",
    DropHighest = "dh",
    DropLowest = "dl",
    KeepLowest = "kl",
    KeepHighest = "kh"
}

export interface RollDefinition {
    numberOfDice: number,
    numberOfSides: number,
    dropLowest?: number | undefined,
    dropHighest?: number | undefined,
    keepLowest?: number | undefined,
    keepHighest?: number | undefined,
    amountChange?: number
}

export interface DieRollResult {
    number: number,
    isDropped: boolean
}

export interface DiceRollResult {
    dieRollResults: DieRollResult[],
    sum: number
}

export const getDieRollResult = (number: number, isDropped: boolean) => ({
    number: number,
    isDropped: isDropped
})

export const getLexorResultError = (errorMessage: string): Result<RollDefinition> => ({
    success: false,
    errorMessage: errorMessage,
});

export const getLexorResultSuccess = (roll: RollDefinition): Result<RollDefinition> => ({
    success: true,
    data: roll,
});
