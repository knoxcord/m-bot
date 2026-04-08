import { OmitPartialGroupDMChannel, Message } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { reportAdHocActivityForServer, getHourWindowForDate } from "../../features/roleActivity/roleActivity.js";

const Key = CommandKey.RoleActivity

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    await reportAdHocActivityForServer(message, getHourWindowForDate(new Date()))
}

export const RoleActivity: IPrefixCommand = {
    handler: handler,
    key: Key
}