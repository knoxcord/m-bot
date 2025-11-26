export enum CommandKey {
    Roll = "roll",
}

export interface IPrefixCommand
{
    /** Handler function to be executed when the command is invoked */
    handler: (interaction: unknown) => Promise<unknown>,
    /** This is used to identify incoming prefix commands. Matches will have their {@link IPrefixCommand.handler handler} invoked */
    key: CommandKey
}