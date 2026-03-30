import { OmitPartialGroupDMChannel, Message } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { reportActivityForServer, getHourWindowForDate } from "../../features/roleActivity/roleActivity.js";

const Key = CommandKey.RoleActivity

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    if (!message.guildId || !message.guild)
        return;

    await reportActivityForServer(message.guildId, message.guild, getHourWindowForDate(new Date()))
}

export const RoleActivity: IPrefixCommand = {
    handler: handler,
    key: Key
}