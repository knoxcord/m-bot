import { ChatInputCommandInteraction, SharedSlashCommand } from "discord.js";

export enum CommandKey {
    Ping = "ping",
    Tarot = "tarot",
    Roll = "roll",
    Configure = "configure",
    Version = "version",
    Feature = "feature",
    SetupRoleAddMessage = "setuproleaddmessage",
}

export interface ISlashCommand
{
    /** Builder function to register the command */
    builder: SharedSlashCommand,
    /** Handler function to be executed when the command is invoked */
    handler: (interaction: ChatInputCommandInteraction) => Promise<unknown>,
    /** This is used to identify incoming slash commands. Matches will have their {@link ISlashCommand.handler handler} invoked */
    key: CommandKey
}