import { inlineCode } from "discord.js";
import { replyHandler } from "../../features/say/reply.ts";
import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";

export const Reply: IPrefixCommand = {
    handler: replyHandler,
    key: CommandKey.Reply,
    description: 'Replies to a message',
    usage: `Usage: ${inlineCode("reply <#channel|channelId> <messageId> <message>")}`
}
