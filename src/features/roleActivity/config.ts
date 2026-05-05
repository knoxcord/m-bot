import type { ConfigurationRegistration } from "../../features/configuration/configurationTypes.ts";
import type { FeatureFlagRegistration } from "../featureFlags/featureFlagTypes.ts";

export const TrackedRoleIdsConfigurationKey = 'TRACKED_ROLE_IDS';
export const RoleActivityChannelIdConfigurationKey = 'ROLE_ACTIVITY_CHANNEL_ID';

export const RoleActivityFeatureFlag = 'TRACKED_ROLES';
export const RoleActivityReportingFeatureFlag = 'TRACKED_ROLE_REPORTING';
export const RoleActivityHolographicFeatureFlag = 'TRACKED_ROLE_HOLOGRAPHIC';
export const ActivityByUserFeatureFlag = 'TRACK_ACTIVITY_BY_USER';
export const ActivityByUserReportingFeatureFlag = 'TRACK_ACTIVITY_BY_USER_REPORTING';

export const roleActivityConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Tracked Role Ids', TrackedRoleIdsConfigurationKey],
    ['Role Activity Channel Id', RoleActivityChannelIdConfigurationKey],
];

export const roleActivityFeatureFlagRegistrations = <FeatureFlagRegistration[]>[
    ['Tracked Role Activity', RoleActivityFeatureFlag],
    ['Tracked Role Activity Reporting', RoleActivityReportingFeatureFlag],
    ['Tracked Role Activity Holographic', RoleActivityHolographicFeatureFlag],
    ['Activity By User', ActivityByUserFeatureFlag],
    ['Activity By User Reporting', ActivityByUserReportingFeatureFlag],
];
