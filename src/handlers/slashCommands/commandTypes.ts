import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";

export enum CommandKey {
    Ping = "ping",
    Tarot = "tarot",
    Roll = "roll",
}

export interface ISlashCommand
{
    /** Builder function to register the command */
    builder: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder,
    /** Handler function to be executed when the command is invoked */
    handler: (interaction: ChatInputCommandInteraction) => Promise<unknown>,
    /** This is used to identify incoming slash commands. Matches will have their {@link ISlashCommand.handler handler} invoked */
    key: CommandKey
}