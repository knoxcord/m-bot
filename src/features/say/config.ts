import type { ConfigurationRegistration } from "../configuration/configurationTypes.ts";

export const RoleIdsThatCanSayConfigurationKey = 'ROLE_IDS_THAT_CAN_SAY';

export const sayConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Role Ids That Can Say', RoleIdsThatCanSayConfigurationKey]
];
