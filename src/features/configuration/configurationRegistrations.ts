import { ConfigurationRegistration } from "./configurationTypes.js";

import { awardConfigurationRegistrations } from "../award/config.js";
import { spankConfigurationRegistrations } from "../spank/config.js";
import { roleActivityConfigurationRegistrations } from "../roleActivity/config.js";
import { getScoreConfigurationRegistrations } from "../../handlers/prefixCommands/getScore.js";
import { setScoreConfigurationRegistrations } from "../../handlers/prefixCommands/setScore.js";

const configurationRegistrations: ConfigurationRegistration[] = [
    ...awardConfigurationRegistrations,
    ...spankConfigurationRegistrations,
    ...roleActivityConfigurationRegistrations,
    ...getScoreConfigurationRegistrations,
    ...setScoreConfigurationRegistrations,
]

export {
    configurationRegistrations
};