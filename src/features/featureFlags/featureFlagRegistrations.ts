import { roleActivityFeatureFlagRegistrations } from "../roleActivity/config.js";
import { channelOrderFeatureFlagRegistrations } from "../channelOrder/config.js";
import { FeatureFlagRegistration } from "./featureFlagTypes.js";

const featureFlagRegistrations: FeatureFlagRegistration[] = [
    ...roleActivityFeatureFlagRegistrations,
    ...channelOrderFeatureFlagRegistrations,
]

export {
    featureFlagRegistrations
};
