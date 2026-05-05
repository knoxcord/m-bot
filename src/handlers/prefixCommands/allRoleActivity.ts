import type { OmitPartialGroupDMChannel, Message } from "discord.js";
import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";
import { allRoleActivity } from "../../features/roleActivity/roleActivity.ts";

const Key = CommandKey.AllRoleActivity

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    await allRoleActivity(message);
}

export const AllRoleActivity: IPrefixCommand = {
    handler: handler,
    key: Key
}