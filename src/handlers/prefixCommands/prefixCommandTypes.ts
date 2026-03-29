import { Message, OmitPartialGroupDMChannel } from "discord.js";
import { ConfigurationRegistration } from "src/configuration/configurationTypes.js";

export enum CommandKey {
    Roll = "roll",
    PawaRoll = "pawaroll",
    Slap = "slap",
    SlapStats = "slapstats",
    Smack = "smack",
    SmackStats = "smackstats",
    Spank = "spank",
    SpankStats = "spankstats",
    Award = "award",
}

export interface IPrefixCommand
{
    /** Handler function to be executed when the command is invoked */
    handler: (message: OmitPartialGroupDMChannel<Message<boolean>>) => Promise<unknown>,
    /** This is used to identify incoming prefix commands. Matches will have their {@link IPrefixCommand.handler handler} invoked */
    key: CommandKey,
    /** This contains configuration registrations for prefix command handlers */
    configurationRegistrations?: ConfigurationRegistration[];
}