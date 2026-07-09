import type { ConfigurationRegistration } from "../configuration/configurationTypes.ts";
import type { FeatureFlagRegistration } from "../featureFlags/featureFlagTypes.ts";

export const TopicsFeatureFlag = 'TOPICS';
export const AutoTopicFeatureFlag = 'AUTO_TOPIC';

export const RoleIdsThatCanAddTopicsConfigurationKey = 'ROLE_IDS_THAT_CAN_ADD_TOPICS';
export const PreloadedTopicsUserIdConfigurationKey = 'PRELOADED_TOPICS_USER_ID';
export const AutoTopicChannelIdConfigurationKey = 'AUTO_TOPIC_CHANNEL_ID';
export const AutoTopicInactivityMinutesConfigurationKey = 'AUTO_TOPIC_INACTIVITY_MINUTES';
export const AutoTopicQuietHoursStartConfigurationKey = 'AUTO_TOPIC_QUIET_HOURS_START_UTC';
export const AutoTopicQuietHoursEndConfigurationKey = 'AUTO_TOPIC_QUIET_HOURS_END_UTC';
export const ChannelIdsWhereTopicsCanBeAddedConfigurationKey = 'CHANNEL_IDS_WHERE_TOPICS_CAN_BE_ADDED';
export const TopicLogChannelIdConfigurationKey = 'TOPIC_LOG_CHANNEL_ID';

export const TopicWeightConfigurationKeys = {
    RecencyCooldownHours: 'TOPIC_WEIGHT_RECENCY_COOLDOWN_HOURS',
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
    ['Auto Topic Quiet Hours Start (UTC, HH:MM)', AutoTopicQuietHoursStartConfigurationKey],
    ['Auto Topic Quiet Hours End (UTC, HH:MM)', AutoTopicQuietHoursEndConfigurationKey],
    ['Topic Weight: Recency Cooldown Hours (Topic Never Shown Within This Window)', TopicWeightConfigurationKeys.RecencyCooldownHours],
    ['Topic Weight: Recency Window Hours (Recency Bias Returns To Normal Over This Window After Cooldown)', TopicWeightConfigurationKeys.RecencyWindowHours],
    ['Topic Weight: Recency Floor', TopicWeightConfigurationKeys.RecencyFloor],
    ['Topic Weight: Preloaded User Multiplier', TopicWeightConfigurationKeys.PreloadedUserMultiplier],
    ['Topic Weight: Vote Step', TopicWeightConfigurationKeys.VoteStep],
    ['Topic Weight: Vote Floor', TopicWeightConfigurationKeys.VoteFloor],
    ['Topic Weight: Vote Ceiling', TopicWeightConfigurationKeys.VoteCeiling],
    ['Channel Ids Where Topics Can Be Added (Unset Means Anywhere)', ChannelIdsWhereTopicsCanBeAddedConfigurationKey],
    ['Topic Log Channel Id (Where Added Topics Are Logged)', TopicLogChannelIdConfigurationKey],
];

export const topicFeatureFlagRegistrations = <FeatureFlagRegistration[]>[
    ['Topics', TopicsFeatureFlag],
    ['Auto Topic', AutoTopicFeatureFlag],
];
