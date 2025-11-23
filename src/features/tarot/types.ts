export const TarotCustomIdKey = "tarot";
export const TarotCardReversedIndicator = "!";

export enum FieldId {
    Purpose = "Purpose",
    PullType = "PullType",
    IsPublic = "IsPublic",
    IncludeReversed = "IncludeReversed"
}

export enum PullType {
    Single = "single",
    Double = "double",
    Triple = "triple"
}

export enum NextOrPrev {
    Next = "next",
    Previous = "previous"
}

export interface ICard {
    name: string,
    element: string,
    sign: string,
    quality: string,
    planet: string,
    meaning: string,
    imageSrc: string,
    color: number,
    id: string,
    reversed?: boolean,
};
