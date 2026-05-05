import type { ConfigurationRegistration } from "../../features/configuration/configurationTypes.ts";

export const RoleIdsThatCanAwardConfigurationKey = 'ROLE_IDS_THAT_CAN_AWARD';

export const awardConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Role Ids That Can Award', RoleIdsThatCanAwardConfigurationKey]
];
