import { OmitPartialGroupDMChannel, Message } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { handleMute, muteConfigurationRegistrations } from "../../features/spank/mute.js";
import { CommandPrefix } from "./index.js";

const getCommand = (commandKey: string) => <IPrefixCommand>{
    handler: async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
        if (!message.inGuild())
            return;

        const commandBody = message.content.slice(commandKey.length + CommandPrefix.length).trim();
        await handleMute(commandBody, message);
    },
    key: commandKey
};

export const Spank = getCommand(CommandKey.Spank);
export const Smack = getCommand(CommandKey.Smack);
export const Slap = {
    ...getCommand(CommandKey.Slap),
    configurationRegistrations: muteConfigurationRegistrations
};
