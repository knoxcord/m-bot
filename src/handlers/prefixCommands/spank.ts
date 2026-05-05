import type { OmitPartialGroupDMChannel, Message} from "discord.js";
import { inlineCode } from "discord.js";
import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";
import { handleSpank } from "../../features/spank/spank.ts";

const getCommand = (commandKey: string) => <IPrefixCommand>{
    handler: async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
        if (!message.inGuild())
            return;

        await handleSpank(commandBody, message);
    },
    key: commandKey,
    description: "Mutes the user for a short amount of time",
    usage: `Usage: ${inlineCode(`${commandKey} <@user|userId> [reason]`)}`
};

export const Spank = getCommand(CommandKey.Spank);
export const Smack = getCommand(CommandKey.Smack);
export const Slap = getCommand(CommandKey.Slap);
