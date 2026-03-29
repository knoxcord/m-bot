import { ConfigurationRegistration } from "./configurationTypes.js";

import { awardConfigurationRegistrations } from "../features/award/config.js";
import { spankConfigurationRegistrations } from "../features/spank/config.js";

const configurationRegistrations: ConfigurationRegistration[] = [
    ...awardConfigurationRegistrations,
    ...spankConfigurationRegistrations
]

export {
    configurationRegistrations
};