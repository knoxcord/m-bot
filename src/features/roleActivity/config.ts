import { ConfigurationRegistration } from "src/features/configuration/configurationTypes.js";
import { FeatureFlagRegistration } from "../featureFlags/featureFlagTypes.js";

export const TrackedRoleIdsConfigurationKey = 'TRACKED_ROLE_IDS';
export const RoleActivityChannelIdConfigurationKey = 'ROLE_ACTIVITY_CHANNEL_ID';

export const RoleActivityFeatureFlag = 'TRACKED_ROLES';
export const RoleActivityReportingFeatureFlag = 'TRACKED_ROLE_REPORTING';
export const RoleActivityHolographicFeatureFlag = 'TRACKED_ROLE_HOLOGRAPHIC';

export const roleActivityConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Tracked Role Ids', TrackedRoleIdsConfigurationKey],
    ['Role Activity Channel Id', RoleActivityChannelIdConfigurationKey],
];

export const roleActivityFeatureFlagRegistrations = <FeatureFlagRegistration[]>[
    ['Tracked Role Activity', RoleActivityFeatureFlag],
    ['Tracked Role Activity Reporting', RoleActivityReportingFeatureFlag],
    ['Tracked Role Activity Holographic', RoleActivityHolographicFeatureFlag],
];
