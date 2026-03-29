import { roleActivityFeatureFlagRegistrations } from "../roleActivity/config.js";
import { FeatureFlagRegistration } from "./featureFlagTypes.js";

const featureFlagRegistrations: FeatureFlagRegistration[] = [
    ...roleActivityFeatureFlagRegistrations
]

export {
    featureFlagRegistrations
};
