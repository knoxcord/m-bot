import { ConfigurationRegistration } from "./configurationTypes.js";

export const ModeratorRolesConfigurationKey = "MODERATION_ROLES";

const baseConfigs = <ConfigurationRegistration[]>[
    ['Moderator Roles', ModeratorRolesConfigurationKey]
]

// Configuration options not related to a specific command can go here
export {
    baseConfigs
};