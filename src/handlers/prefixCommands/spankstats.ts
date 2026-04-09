import { OmitPartialGroupDMChannel, Message } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { handleStats } from "../../features/spank/stats.js";

const getCommand = (commandKey: string) => <IPrefixCommand>{
    handler: async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
        if (!message.inGuild())
            return;

        await handleStats(commandBody, message);
    },
    key: commandKey
};

export const SpankStats = getCommand(CommandKey.SpankStats);
export const SmackStats = getCommand(CommandKey.SmackStats);
export const SlapStats = getCommand(CommandKey.SlapStats);
