import type { ConfigurationRegistration } from "../configuration/configurationTypes.ts";
import type { FeatureFlagRegistration } from "../featureFlags/featureFlagTypes.ts";

export const TopicsFeatureFlag = 'TOPICS';
export const AutoTopicFeatureFlag = 'AUTO_TOPIC';

export const RoleIdsThatCanAddTopicsConfigurationKey = 'ROLE_IDS_THAT_CAN_ADD_TOPICS';
export const PreloadedTopicsUserIdConfigurationKey = 'PRELOADED_TOPICS_USER_ID';
export const AutoTopicChannelIdConfigurationKey = 'AUTO_TOPIC_CHANNEL_ID';
export const AutoTopicInactivityMinutesConfigurationKey = 'AUTO_TOPIC_INACTIVITY_MINUTES';

export const TopicWeightConfigurationKeys = {
    RecencyWindowHours: 'TOPIC_WEIGHT_RECENCY_WINDOW_HOURS',
    RecencyFloor: 'TOPIC_WEIGHT_RECENCY_FLOOR',
    PreloadedUserMultiplier: 'TOPIC_WEIGHT_PRELOADED_USER_MULTIPLIER',
    VoteStep: 'TOPIC_WEIGHT_VOTE_STEP',
    VoteFloor: 'TOPIC_WEIGHT_VOTE_FLOOR',
    VoteCeiling: 'TOPIC_WEIGHT_VOTE_CEILING',
} as const;

export const topicConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Role Ids That Can Add Topics', RoleIdsThatCanAddTopicsConfigurationKey],
    ['Preloaded Topics User Id', PreloadedTopicsUserIdConfigurationKey],
    ['Auto Topic Channel Id', AutoTopicChannelIdConfigurationKey],
    ['Auto Topic Inactivity Minutes', AutoTopicInactivityMinutesConfigurationKey],
    ['Topic Weight: Recency Window Hours', TopicWeightConfigurationKeys.RecencyWindowHours],
    ['Topic Weight: Recency Floor', TopicWeightConfigurationKeys.RecencyFloor],
    ['Topic Weight: Preloaded User Multiplier', TopicWeightConfigurationKeys.PreloadedUserMultiplier],
    ['Topic Weight: Vote Step', TopicWeightConfigurationKeys.VoteStep],
    ['Topic Weight: Vote Floor', TopicWeightConfigurationKeys.VoteFloor],
    ['Topic Weight: Vote Ceiling', TopicWeightConfigurationKeys.VoteCeiling],
];

export const topicFeatureFlagRegistrations = <FeatureFlagRegistration[]>[
    ['Topics', TopicsFeatureFlag],
    ['Auto Topic', AutoTopicFeatureFlag],
];
