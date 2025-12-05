import { OmitPartialGroupDMChannel, Message } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { handleMute } from "../../features/spank/mute.js";
import { CommandPrefix } from "./index.js";

export const Key = CommandKey.Smack;

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    if (!message.inGuild())
        return;

    const commandBody = message.content.slice(Key.length + CommandPrefix.length).trim();
    await handleMute(commandBody, message, 'smack');
}

export const Smack: IPrefixCommand = {
    handler: handler,
    key: Key
}