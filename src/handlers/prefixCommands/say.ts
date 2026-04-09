import { inlineCode } from "discord.js";
import { sayHandler } from "../../features/say/say.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";

export const Say: IPrefixCommand = {
    handler: sayHandler,
    key: CommandKey.Say,
    description: 'Posts a message',
    usage: `Usage: ${inlineCode("say <#channel|channelId> <message>")}`
}
