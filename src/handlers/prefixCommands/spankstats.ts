import { OmitPartialGroupDMChannel, Message } from "discord.js";
import { CommandKey, CommandPrefix, IPrefixCommand } from "./prefixCommandTypes.js";
import { handleStats } from "../../features/spank/stats.js";

const getCommand = (commandKey: string) => <IPrefixCommand>{
    handler: async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
        if (!message.inGuild())
            return;

        const commandBody = message.content.slice(commandKey.length + CommandPrefix.length).trim();
        await handleStats(commandBody, message);
    },
    key: commandKey
};

export const SpankStats = getCommand(CommandKey.SpankStats);
export const SmackStats = getCommand(CommandKey.SmackStats);
export const SlapStats = getCommand(CommandKey.SlapStats);
