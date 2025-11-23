import { ICard } from "./types.js";

export const getKey = (card: ICard) => `${card.reversed ? "!" : ""}${card.id}`;