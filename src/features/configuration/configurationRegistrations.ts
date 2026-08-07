import type { ConfigurationRegistration } from "./configurationTypes.ts";

import { awardConfigurationRegistrations } from "../award/config.ts";
import { spankConfigurationRegistrations } from "../spank/config.ts";
import { roleActivityConfigurationRegistrations } from "../roleActivity/config.ts";
import { getScoreConfigurationRegistrations } from "../../handlers/prefixCommands/getScore.ts";
import { setScoreConfigurationRegistrations } from "../../handlers/prefixCommands/setScore.ts";
import { sayConfigurationRegistrations } from "../say/config.ts";
import { rouletteConfigurationRegistrations } from "../../handlers/prefixCommands/russianRoulette.ts";
import { channelOrderConfigurationRegistrations } from "../channelOrder/config.ts";
import { topicConfigurationRegistrations } from "../topic/config.ts";
import { sharedConfigurationRegistrations } from "./shared.ts";
import { submissionReviewConfigurationRegistrations } from "../submissionReview/config.ts";
import { communityNewsConfigurationRegistrations } from "../communityNews/config.ts";

const configurationRegistrations: ConfigurationRegistration[] = [
    ...sharedConfigurationRegistrations,
    ...awardConfigurationRegistrations,
    ...spankConfigurationRegistrations,
    ...roleActivityConfigurationRegistrations,
    ...getScoreConfigurationRegistrations,
    ...setScoreConfigurationRegistrations,
    ...sayConfigurationRegistrations,
    ...rouletteConfigurationRegistrations,
    ...channelOrderConfigurationRegistrations,
    ...topicConfigurationRegistrations,
    ...submissionReviewConfigurationRegistrations,
    ...communityNewsConfigurationRegistrations
]

export {
    configurationRegistrations
};