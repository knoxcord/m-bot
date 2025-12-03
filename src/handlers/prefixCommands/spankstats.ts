import { OmitPartialGroupDMChannel, Message } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { handleStats } from "../../features/spank/stats.js";
import { CommandPrefix } from "./index.js";

export const Key = CommandKey.SpankStats;

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    if (!message.inGuild())
        return;

    const commandBody = message.content.slice(Key.length + CommandPrefix.length).trim();
    await handleStats(commandBody, message);
}

export const SpankStats: IPrefixCommand = {
    handler: handler,
    key: Key
}