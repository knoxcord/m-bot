import type { ConfigurationRegistration } from "../configuration/configurationTypes.ts";
import type { FeatureFlagRegistration } from "../featureFlags/featureFlagTypes.ts";

export const CommunityNewsChannelIdConfigurationKey = 'COMMUNITY_NEWS_CHANNEL_ID';

export const communityNewsConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Community News Channel Id (Where Approved News Letters Are Posted)', CommunityNewsChannelIdConfigurationKey],
];

export const RequireCommunityNewsSubmissionReviewFeatureFlag = 'REQUIRE_COMMUNITY_NEWS_SUBMISSION_REVIEW';

export const communityNewsFeatureFlagRegistrations = <FeatureFlagRegistration[]>[
    ['Require community news submissions to be reviewed before they are posted', RequireCommunityNewsSubmissionReviewFeatureFlag],
];
