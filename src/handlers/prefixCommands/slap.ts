import { OmitPartialGroupDMChannel, Message } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { handleMute } from "../../features/spank/mute.js";
import { CommandPrefix } from "./index.js";

export const Key = CommandKey.Slap;

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    if (!message.inGuild())
        return;

    const commandBody = message.content.slice(Key.length + CommandPrefix.length).trim();
    await handleMute(commandBody, message, 'slap');
}

export const Slap: IPrefixCommand = {
    handler: handler,
    key: Key
}