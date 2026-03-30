import { Configure } from "./configure.js";
import { Feature } from "./feature.js";
import { Ping } from "./ping.js";
import { Roll } from "./roll.js";
import { SetupRoleAddMessage } from "./setupRoleAddMessage.js";
import { Tarot } from "./tarot.js";
import { Version } from "./version.js";

const slashCommands = [
    Ping,
    Tarot,
    Roll,
    Version,
    Configure,
    Feature,
    SetupRoleAddMessage,
] as const;

export {
    slashCommands
};