export const RollSeparator = ",";

export enum DropKeepEnum {
    Drop = "d",
    Keep = "k",
    DropHighest = "dh",
    DropLowest = "dl"
}

export interface IRoll {
    numberOfDice: number,
    numberOfSides: number,
    dropLowest?: number | undefined,
    dropHighest?: number | undefined,
}

type LexorResultSuccess = {
    success: true,
    errorMessage: undefined;
    roll: IRoll
};

type LexorResultError = {
    success: false;
    errorMessage: string;
    roll: undefined;
}

export type LexorResult = LexorResultSuccess | LexorResultError;

export const getLexorResultError = (errorMessage: string): LexorResultError => ({
    success: false,
    errorMessage: errorMessage,
    roll: undefined
});

export const getLexorResultSuccess = (roll: IRoll): LexorResultSuccess => ({
    success: true,
    roll: roll,
    errorMessage: undefined
});
