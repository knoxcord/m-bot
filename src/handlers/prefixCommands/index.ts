import { Roll } from "./roll.ts";
import { PawaRoll } from "./pawaroll.ts"
import { Spank, Smack, Slap } from "./spank.ts"
import { SpankStats, SmackStats, SlapStats } from "./spankstats.ts";
import { Award } from "./award.ts";
import { RoleActivity } from "./roleActivity.ts";
import { AllRoleActivity } from "./allRoleActivity.ts";
import { GetScore } from "./getScore.ts";
import { React } from "./react.ts";
import { Reply } from "./reply.ts";
import { Say } from "./say.ts";
import { SetScore } from "./setScore.ts";
import { TopMessagesLastHour } from "./topMessagesLastHour.ts";
import { Help } from "./help.ts";
import { RussianRoulette } from "./russianRoulette.ts";
import { RussianRouletteStats } from "./russianRouletteStats.ts";
import { Shoot } from "./shoot.ts";
import { Topic } from "./topic.ts";
import { AddTopic } from "./addTopic.ts";
import { Bazooka } from "./bazooka.ts";

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
    TopMessagesLastHour,
    Say,
    Reply,
    React,
    Help,
    RussianRoulette,
    RussianRouletteStats,
    Shoot,
    Topic,
    AddTopic,
    Bazooka
] as const;

export {
    prefixCommands,
};