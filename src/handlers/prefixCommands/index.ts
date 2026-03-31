import { Roll } from "./roll.js";
import { PawaRoll } from "./pawaroll.js"
import { Spank, Smack, Slap } from "./spank.js"
import { SpankStats, SmackStats, SlapStats } from "./spankstats.js";
import { Award } from "./award.js";
import { RoleActivity } from "./roleActivity.js";
import { AllRoleActivity } from "./allRoleActivity.js";
import { GetScore } from "./getScore.js";
import { SetScore } from "./setScore.js";
import { DeleteScore } from "./deleteScore.js";

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
    RoleActivity,
    AllRoleActivity,
    GetScore,
    SetScore,
    DeleteScore,
] as const;

export {
    prefixCommands,
};