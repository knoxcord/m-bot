import { SlashCommandBuilder } from "discord.js";

export interface ICommand<T, K>
{
    /** Builder function to register the command */
    builder: SlashCommandBuilder,
    /** Handler function to be executed when the command is invoked */
    handler: (data: T) => Promise<K>,
    /** This is used to key off incoming slash commands. Matches will have their {@link ICommand.handler handler} invoked */
    name: string
}