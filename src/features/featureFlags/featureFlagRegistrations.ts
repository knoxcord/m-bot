import { roleActivityFeatureFlagRegistrations } from "../roleActivity/config.js";
import { channelOrderFeatureFlagRegistrations } from "../channelOrder/config.js";
import { FeatureFlagRegistration } from "./featureFlagTypes.js";
import { topicsFeatureFlagRegistrations } from "../../handlers/prefixCommands/topic.js";

const featureFlagRegistrations: FeatureFlagRegistration[] = [
    ...roleActivityFeatureFlagRegistrations,
    ...channelOrderFeatureFlagRegistrations,
    ...topicsFeatureFlagRegistrations
]

export {
    featureFlagRegistrations
};
