import type { ConfigurationRegistration } from "../configuration/configurationTypes.ts";

export const CommunityNewsChannelIdConfigurationKey = 'COMMUNITY_NEWS_CHANNEL_ID';

export const communityNewsConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Community News Channel Id (Where Approved News Letters Are Posted)', CommunityNewsChannelIdConfigurationKey],
];
