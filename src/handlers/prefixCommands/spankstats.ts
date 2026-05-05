import type { OmitPartialGroupDMChannel, Message } from "discord.js";
import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";
import { handleStats } from "../../features/spank/stats.ts";

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
