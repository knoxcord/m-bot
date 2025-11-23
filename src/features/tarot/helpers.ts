import { ICard, TarotCardReversedIndicator } from "./types.js";

export const getKey = (card: ICard) => `${card.isReversed ? TarotCardReversedIndicator : ""}${card.id}`;