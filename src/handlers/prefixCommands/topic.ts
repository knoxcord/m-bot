import { inlineCode, Message, OmitPartialGroupDMChannel } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import topics from "../../features/topic/topics.js";

const topicHandler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, _commandBody: string) => {
    if (!message.guildId)
        return;

    const topic = topics.getRandomTopic(message.guildId);

    if (!topic) {
        await message.reply("There aren't any topics available for this server. Why don't you try adding some using the addtopic command?")
        return;
    }
    
    // TODO: hydrate template values?
    await message.channel.send(topic.Topic);
}

export const Topic: IPrefixCommand = {
    handler: topicHandler,
    key: CommandKey.Topic,
    mentionOnly: true,
    description: "Posts a discussion topic",
    usage: `Usage: ${inlineCode("topic")}`
}
