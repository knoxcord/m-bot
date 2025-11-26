export const RollSeparator = ",";

export enum DropKeepEnum {
    Drop = "d",
    Keep = "k",
    DropHighest = "dh",
    DropLowest = "dl",
    KeepLowest = "kl",
    KeepHighest = "kh"
}

export interface IRoll {
    numberOfDice: number,
    numberOfSides: number,
    dropLowest?: number | undefined,
    dropHighest?: number | undefined,
    amountChange?: number
}

type LexorResultSuccess = {
    success: true,
    roll: IRoll
};

type LexorResultError = {
    success: false;
    errorMessage: string;
}

export type LexorResult = LexorResultSuccess | LexorResultError;

type ParseRollsSuccess = {
    success: true,
    rolls: IRoll[],
}

type ParseRollsError = {
    success: false,
    errorMessage: string
}

export type ParseRollsResult = ParseRollsSuccess | ParseRollsError;

export const getLexorResultError = (errorMessage: string): LexorResultError => ({
    success: false,
    errorMessage: errorMessage,
});

export const getLexorResultSuccess = (roll: IRoll): LexorResultSuccess => ({
    success: true,
    roll: roll,
});
