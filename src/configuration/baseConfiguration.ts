import Configuration from './configuration.js';

export const BotAdminRolesConfigurationKey = "BOT_ADMIN_ROLES";
export const ModeratorRolesConfigurationKey = "MODERATION_ROLES";

// Configuration options not related to a specific command can go hereQ
Configuration.registerConfigurations([
    ['Bot Admin Roles', BotAdminRolesConfigurationKey],
    ['Moderator Roles', ModeratorRolesConfigurationKey]
]);