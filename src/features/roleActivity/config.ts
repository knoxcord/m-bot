import { ConfigurationRegistration } from "src/configuration/configurationTypes.js";

export const TrackedRoleIdsConfigurationKey = 'TRACKED_ROLE_IDS';
export const RoleActivityChannelIdConfigurationKey = 'ROLE_ACTIVITY_CHANNEL_ID';

export const roleActivityConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Tracked Role Ids', TrackedRoleIdsConfigurationKey],
    ['Role Activity Channel Id', RoleActivityChannelIdConfigurationKey],
];
