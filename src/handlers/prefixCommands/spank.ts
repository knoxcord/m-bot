import { OmitPartialGroupDMChannel, Message } from "discord.js";
import { CommandKey, CommandPrefix, IPrefixCommand } from "./prefixCommandTypes.js";
import { handleSpank } from "../../features/spank/spank.js";

const getCommand = (commandKey: string) => <IPrefixCommand>{
    handler: async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
        if (!message.inGuild())
            return;

        const commandBody = message.content.slice(commandKey.length + CommandPrefix.length).trim();
        await handleSpank(commandBody, message);
    },
    key: commandKey
};

export const Spank = getCommand(CommandKey.Spank);
export const Smack = getCommand(CommandKey.Smack);
export const Slap = getCommand(CommandKey.Slap);
