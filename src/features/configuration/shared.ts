import type { ConfigurationRegistration } from "./configurationTypes.ts";

export const ModeratorRoleIdsConfigurationKey = 'MODERATOR_ROLE_IDS';

export const sharedConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Moderator Role IDs - Users with any of these roles can control the bot', ModeratorRoleIdsConfigurationKey],
];