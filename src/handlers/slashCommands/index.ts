import { Configure } from "./configure.js";
import { Feature } from "./feature.js";
import { Ping } from "./ping.js";
import { Roll } from "./roll.js";
import { Tarot } from "./tarot.js";
import { Version } from "./version.js";

const slashCommands = [
    Ping,
    Tarot,
    Roll,
    Version,
    Configure,
    Feature,
] as const;

export {
    slashCommands
};