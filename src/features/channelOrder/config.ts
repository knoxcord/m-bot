import type { ConfigurationRegistration } from "../configuration/configurationTypes.ts";
import type { FeatureFlagRegistration } from "../featureFlags/featureFlagTypes.ts";

export const ChannelOrderLogChannelIdConfigurationKey = 'CHANNEL_ORDER_LOG_CHANNEL_ID';

export const ChannelOrderLoggingFeatureFlag = 'CHANNEL_ORDER_LOGGING';

export const channelOrderConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Channel Order Log Channel Id', ChannelOrderLogChannelIdConfigurationKey],
];

export const channelOrderFeatureFlagRegistrations = <FeatureFlagRegistration[]>[
    ['Channel Order Logging', ChannelOrderLoggingFeatureFlag],
];
