import { AutocompleteInteraction, ChatInputCommandInteraction, SharedSlashCommand } from "discord.js";

export enum CommandKey {
    Ping = "ping",
    Tarot = "tarot",
    Roll = "roll",
    Configure = "configure",
    Version = "version",
    Feature = "feature",
    SetupRoleAddMessage = "setuproleaddmessage",
    SetupPresetRoleMessage = "setuppresetrolemessage",
    LocationInfo = "location-info",
    LocationManage = "location-manage",
    SetActivity = "setactivity",
    TopicManage = "topic-manage",
}

export interface ISlashCommand
{
    /** Builder function to register the command */
    builder: SharedSlashCommand,
    /** Handler function to be executed when the command is invoked */
    handler: (interaction: ChatInputCommandInteraction) => Promise<unknown>,
    /** Handler function for autocomplete interactions */
    autocompleteHandler?: (interaction: AutocompleteInteraction) => Promise<unknown>,
    /** This is used to identify incoming slash commands. Matches will have their {@link ISlashCommand.handler handler} invoked */
    key: CommandKey
}