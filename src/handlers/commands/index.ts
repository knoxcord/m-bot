import { Ping } from "./ping.js";
import { Roll } from "./roll.js";
import { Tarot } from "./tarot.js";

const commands = [
    Ping,
    Tarot,
    Roll
] as const;

export {
    commands
};