import type { Message, OmitPartialGroupDMChannel } from "discord.js";
import { inlineCode } from "discord.js";
import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";
import topics from "../../features/topic/topics.ts";
import featureFlags from "../../features/featureFlags/featureFlags.ts";
import { TopicsFeatureFlag } from "../../features/topic/config.ts";

const topicHandler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, _commandBody: string) => {
    if (!message.guildId)
        return;

    if (!featureFlags.getFeatureFlag(message.guildId, TopicsFeatureFlag)) return;

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
    description: "Posts a discussion topic",
    usage: `Usage: ${inlineCode("topic")}`
}
