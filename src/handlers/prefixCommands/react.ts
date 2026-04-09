import { inlineCode } from "discord.js";
import { reactHandler } from "../../features/say/react.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";

export const React: IPrefixCommand = {
    handler: reactHandler,
    key: CommandKey.React,
    description: 'Reacts to a message',
    usage: `Usage: ${inlineCode("react <#channel|channelId> <messageId> <emojis>")}`
}
