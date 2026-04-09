import { inlineCode } from "discord.js";
import { replyHandler } from "../../features/say/reply.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";

export const Reply: IPrefixCommand = {
    handler: replyHandler,
    key: CommandKey.Reply,
    helpMessage: `Usage: ${inlineCode("-reply <#channel|channelId> <messageId> <message>")}`
}
