import { OmitPartialGroupDMChannel, Message } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { allRoleActivity } from "../../features/roleActivity/roleActivity.js";

const Key = CommandKey.AllRoleActivity

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    if (!message.guildId)
        return;

    await allRoleActivity(message.client, message.guildId);
}

export const AllRoleActivity: IPrefixCommand = {
    handler: handler,
    key: Key
}