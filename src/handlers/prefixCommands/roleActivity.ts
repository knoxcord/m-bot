import { OmitPartialGroupDMChannel, Message } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { runRoleActivityHourlyJob } from "../../features/roleActivity/roleActivity.js";

const Key = CommandKey.RoleActivity

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    await runRoleActivityHourlyJob(message.client, message.guildId)
}

export const RoleActivity: IPrefixCommand = {
    handler: handler,
    key: Key
}