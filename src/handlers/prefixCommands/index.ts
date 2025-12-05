import { Roll } from "./roll.js";
import { PawaRoll } from "./pawaroll.js"
import { Spank } from "./spank.js"
import { SpankStats } from "./spankstats.js";
import { Smack } from "./smack.js";
import { Slap } from "./slap.js";
import { SlapStats } from "./slapstats.js";
import { SmackStats } from "./smackstats.js";

export const CommandPrefix = '-';

const prefixCommands = [
    Roll,
    PawaRoll,
    Spank,
    Slap,
    Smack,
    SpankStats,
    SlapStats,
    SmackStats,
] as const;

export {
    prefixCommands
};