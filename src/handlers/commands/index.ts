import { Ping } from "./ping.js";
import { Tarot } from "./tarot.js";

const commands = [
    Ping,
    Tarot
] as const;

export {
    commands
};