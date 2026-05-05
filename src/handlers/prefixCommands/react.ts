import { inlineCode } from "discord.js";
import { reactHandler } from "../../features/say/react.ts";
import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";

export const React: IPrefixCommand = {
    handler: reactHandler,
    key: CommandKey.React,
    description: 'Reacts to a message',
    usage: `Usage: ${inlineCode("react <#channel|channelId> <messageId> <emojis>")}`
}
