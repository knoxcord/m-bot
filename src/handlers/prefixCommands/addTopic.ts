import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";
import topics from "../../features/topic/topics.ts";
import type { OmitPartialGroupDMChannel, Message, GuildMember } from "discord.js";
import { inlineCode } from "discord.js";
import configuration from "../../features/configuration/configuration.ts";
import { getMissingPermissionResponse } from "../../shared/responses.ts";
import { RoleIdsThatCanAddTopicsConfigurationKey } from "../../features/topic/config.ts";

const addTopicHandler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
    if (!message.guildId || !message.guild)
        return;

    if (!commandBody.trim()) {
        await message.reply("You didn't add a topic, silly");
        return;
    }

    const customEmojiPattern = /<a?:(\w+):(\d+)>/g;
    const inaccessibleEmojiNames: string[] = [];
    for (const match of commandBody.matchAll(customEmojiPattern)) {
        if (!message.client.emojis.cache.has(match[2])) {
            inaccessibleEmojiNames.push(inlineCode(match[1]));
        }
    }
    if (inaccessibleEmojiNames.length > 0) {
        await message.reply(`I don't have access to the following emoji, so I can't save this topic: ${inaccessibleEmojiNames.join(", ")}`);
        return;
    }

    const roleIdsThatCanAddTopic = configuration.getConfigurationValue(message.guildId, RoleIdsThatCanAddTopicsConfigurationKey)?.split(',') ?? [];

    // If empty then anyone is allowed
    if (roleIdsThatCanAddTopic.length > 0) {
        const authorUserId = message.author.id;
        let authorUser: GuildMember;
        try {
            authorUser = await message.guild.members.fetch(authorUserId);
        } catch (error) {
            console.warn(`Failed to fetch authorUser for id: ${authorUserId} with error ${error}`);
            return;
        }

        if (!authorUser.roles.cache.hasAny(...roleIdsThatCanAddTopic)) {
            await message.reply(getMissingPermissionResponse(authorUserId));
            return;
        }
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
