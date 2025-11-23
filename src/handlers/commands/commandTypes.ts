import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export enum CommandKey {
    Ping = "ping",
    Tarot = "tarot"
}

export interface ICommand
{
    /** Builder function to register the command */
    builder: SlashCommandBuilder,
    /** Handler function to be executed when the command is invoked */
    handler: (interaction: ChatInputCommandInteraction) => Promise<unknown>,
    /** This is used to identify incoming slash commands. Matches will have their {@link ICommand.handler handler} invoked */
    key: CommandKey
}