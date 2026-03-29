import { Ping } from "./ping.js";
import { Roll } from "./roll.js";
import { Tarot } from "./tarot.js";
import { Version } from "./version.js";

const slashCommands = [
    Ping,
    Tarot,
    Roll,
    Version,
    // Configuration slash command registered seperately
] as const;

export {
    slashCommands
};