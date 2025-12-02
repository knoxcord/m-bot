import { Roll } from "./roll.js";
import { PawaRoll } from "./pawaroll.js"

export const CommandPrefix = '-';

const prefixCommands = [
    Roll,
    PawaRoll
] as const;

export {
    prefixCommands
};