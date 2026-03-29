import { Roll } from "./roll.js";
import { PawaRoll } from "./pawaroll.js"
import { Spank, Smack, Slap } from "./spank.js"
import { SpankStats, SmackStats, SlapStats } from "./spankstats.js";
import { Award } from "./award.js";

const prefixCommands = [
    Roll,
    PawaRoll,
    Spank,
    Slap,
    Smack,
    SpankStats,
    SlapStats,
    SmackStats,
    Award,
] as const;

export {
    prefixCommands,
};