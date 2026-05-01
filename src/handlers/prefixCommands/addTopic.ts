import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import topics from "../../features/topic/topics.js";
import { OmitPartialGroupDMChannel, Message, inlineCode } from "discord.js";

const addTopicHandler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
    if (!message.guildId)
        return;

    if (!commandBody) {
        await message.reply("You didn't add a topic, silly");
        return;
    }

    topics.addTopic(message.guildId, commandBody, message.author.id);
    await message.react("👍");
}

export const AddTopic: IPrefixCommand = {
    handler: addTopicHandler,
    key: CommandKey.AddTopic,
    description: `Adds a new topic that can be returned by the ${inlineCode("topic")} command`,
    usage: `Usage: ${inlineCode("addtopic <topic text>")}`
}