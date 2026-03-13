import { ConfigKey, ConfigValueType, IConfigurationOption } from "./configurationTypes.js";

export const ConfigurationOptions: IConfigurationOption[] = [
    {
        key: ConfigKey.BOT_ADMIN_ROLES,
        valueType: ConfigValueType.TEXT,
        validationRegex: /[\d,]+/,
        description: "Roles that a user must have (at least one) to configure the bot. Seperate with a comma",
        default: ''
    },
    {
        key: ConfigKey.MODERATOR_ROLES,
        valueType: ConfigValueType.TEXT,
        validationRegex: /[\d,]+/,
        description: "Roles that a user must have (at least one) to use moderator-only features. Seperate with a comma",
        default: ''
    },
    {
        key: ConfigKey.MUTED_ROLE,
        valueType: ConfigValueType.TEXT,
        validationRegex: /[\d]+/,
        description: "Role that mutes a user",
        default: ''
    },
    {
        key: ConfigKey.MUTE_DURATION_SECONDS,
        valueType: ConfigValueType.TEXT,
        validationRegex: /[\d]+/,
        description: "Time in seconds that a mute should last",
        default: '10'
    }
]