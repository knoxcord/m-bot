import { inlineCode } from "discord.js";
import { sayHandler } from "../../features/say/say.ts";
import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";

export const Say: IPrefixCommand = {
    handler: sayHandler,
    key: CommandKey.Say,
    description: 'Posts a message',
    usage: `Usage: ${inlineCode("say <#channel|channelId> <message>")}`
}
