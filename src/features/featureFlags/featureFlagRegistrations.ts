import { roleActivityFeatureFlagRegistrations } from "../roleActivity/config.ts";
import { channelOrderFeatureFlagRegistrations } from "../channelOrder/config.ts";
import type { FeatureFlagRegistration } from "./featureFlagTypes.ts";
import { topicFeatureFlagRegistrations } from "../topic/config.ts";

const featureFlagRegistrations: FeatureFlagRegistration[] = [
    ...roleActivityFeatureFlagRegistrations,
    ...channelOrderFeatureFlagRegistrations,
    ...topicFeatureFlagRegistrations
]

export {
    featureFlagRegistrations
};
