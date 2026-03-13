export enum ConfigKey {
    BOT_ADMIN_ROLES = 0,
    MODERATOR_ROLES = 1,
    MUTED_ROLE = 2,
    MUTE_DURATION_SECONDS = 3,
};

export enum ConfigValueType {
    TEXT = 0,
    NUMBER = 1,
};

export interface IConfigurationOption {
    key: ConfigKey,
    valueType: ConfigValueType,
    validationRegex: RegExp,
    description: string,
    default: string
}
