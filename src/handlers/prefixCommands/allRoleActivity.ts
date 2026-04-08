import { OmitPartialGroupDMChannel, Message } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { allRoleActivity } from "../../features/roleActivity/roleActivity.js";

const Key = CommandKey.AllRoleActivity

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    await allRoleActivity(message);
}

export const AllRoleActivity: IPrefixCommand = {
    handler: handler,
    key: Key
}