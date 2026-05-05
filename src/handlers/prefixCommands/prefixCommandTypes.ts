import type { Message, OmitPartialGroupDMChannel } from "discord.js";

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
    RoleActivity = "roleactivity",
    AllRoleActivity = "allroleactivity",
    GetScore = "getscore",
    SetScore = "setscore",
    PresetScore = "presetscore",
    DeleteScore = "deletescore",
    TopMessagesLastHour = "topmessageslasthour",
    Say = "say",
    Reply = "reply",
    React = "react",
    Help = "help",
    RussianRoulette = "russianroulette",
    RussianRouletteStats = "russianroulettestats",
    Shoot = "shoot",
    Topic = "topic",
    AddTopic = "addtopic",
    Bazooka = "bazooka",
}

export interface IPrefixCommand
{
    /** Handler function to be executed when the command is invoked */
    handler: (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => Promise<unknown>,
    /** This is used to identify incoming prefix commands. Matches will have their {@link IPrefixCommand.handler handler} invoked */
    key: CommandKey,
    /** Description of the command */
    description?: string
    /** How to use the command */
    usage?: string
    /** Sets that this command must be triggered using a bot mention instead of prefix. Useful when the prefix and command is shared with another bot */
    mentionOnly?: boolean
}