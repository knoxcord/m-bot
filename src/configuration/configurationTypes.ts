import { CommandKey } from "../handlers/slashCommands/commandTypes.js";

export type ConfigurationRegistration = [key: string, value: string];

export enum ConfigurationSubcommandEnum {
    Get = 'get',
    Set = 'set',
}

export const ConfigurationCommandKey = CommandKey.Configure
