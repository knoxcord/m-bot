import { Roll } from "./roll.js";

export const CommandPrefix = '-';

const prefixCommands = [
    Roll
] as const;

export {
    prefixCommands
};