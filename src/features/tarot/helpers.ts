import type { ICard} from "./types.ts";
import { TarotCardReversedIndicator } from "./types.ts";

export const getKey = (card: ICard) => `${card.isReversed ? TarotCardReversedIndicator : ""}${card.id}`;