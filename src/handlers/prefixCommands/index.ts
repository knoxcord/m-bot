import { Roll } from "./roll.js";
import { PawaRoll } from "./pawaroll.js"
import { Spank } from "./spank.js"
import { SpankStats } from "./spankstats.js";

export const CommandPrefix = '-';

const prefixCommands = [
    Roll,
    PawaRoll,
    Spank,
    SpankStats
] as const;

export {
    prefixCommands
};