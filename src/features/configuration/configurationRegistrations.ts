import { ConfigurationRegistration } from "./configurationTypes.js";

import { awardConfigurationRegistrations } from "../award/config.js";
import { spankConfigurationRegistrations } from "../spank/config.js";
import { roleActivityConfigurationRegistrations } from "../roleActivity/config.js";

const configurationRegistrations: ConfigurationRegistration[] = [
    ...awardConfigurationRegistrations,
    ...spankConfigurationRegistrations,
    ...roleActivityConfigurationRegistrations,
]

export {
    configurationRegistrations
};