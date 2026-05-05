import type { OmitPartialGroupDMChannel, Message } from "discord.js";
import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";
import { reportAdHocActivityForServer, getHourWindowForDate } from "../../features/roleActivity/roleActivity.ts";

const Key = CommandKey.RoleActivity

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    await reportAdHocActivityForServer(message, getHourWindowForDate(new Date()))
}

export const RoleActivity: IPrefixCommand = {
    handler: handler,
    key: Key
}