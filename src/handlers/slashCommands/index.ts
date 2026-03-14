import { Ping } from "./ping.js";
import { Roll } from "./roll.js";
import { Tarot } from "./tarot.js";
import { Configure } from "./configure.js";

const slashCommands = [
    Ping,
    Tarot,
    Roll,
    Configure
] as const;

export {
    slashCommands
};