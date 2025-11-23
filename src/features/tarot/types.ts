import config from '../../config.json' with { type: 'json' }

export const TarotCustomIdKey = "tarot";
export const TarotCardReversedIndicator = "!";
export const TarotImagesPath = `${config.assetSrc}/tarot/`;

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
    color: number,
    element: string,
    id: string,
    isReversed?: boolean,
    name: string,
    planet: string,
    quality: string,
    reversedImageSlug: string,
    reversedKeywords: string
    reversedMeaningLink: string
    sign: string,
    uprightImageSlug: string,
    uprightKeywords: string,
    uprightMeaningLink: string,
};
