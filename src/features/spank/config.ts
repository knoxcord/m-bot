import { ConfigurationRegistration } from "src/configuration/configurationTypes.js";

// Setup feature config
export const MutedRoleIdConfigurationKey = 'MUTED_ROLE_ID';
export const MutedDurationSecondsConfigurationKey = 'MUTED_DURATION_SECONDS';
export const RoleIdsThatCanMuteConfigurationKey = 'ROLE_IDS_THAT_CAN_MUTE';

export const spankConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Muted Role Id', MutedRoleIdConfigurationKey],
    ['Muted Duration Seconds', MutedDurationSecondsConfigurationKey],
    ['Role Ids That Can Mute', RoleIdsThatCanMuteConfigurationKey],
];
