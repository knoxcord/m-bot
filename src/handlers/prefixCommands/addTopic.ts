import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";
import topics from "../../features/topic/topics.ts";
import type { OmitPartialGroupDMChannel, Message, GuildMember } from "discord.js";
import { inlineCode } from "discord.js";
import configuration from "../../features/configuration/configuration.ts";
import { getMissingPermissionResponse } from "../../shared/responses.ts";
import { RoleIdsThatCanAddTopicsConfigurationKey } from "../../features/topic/config.ts";
import { buildInaccessibleEmojiMessage, findInaccessibleCustomEmoji } from "../../features/topic/emojiValidation.ts";

const addTopicHandler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
    if (!message.guildId || !message.guild)
        return;

    if (!commandBody.trim()) {
        await message.reply("You didn't add a topic, silly");
        return;
    }

    const inaccessibleEmojiNames = findInaccessibleCustomEmoji(commandBody, message.client);
    if (inaccessibleEmojiNames.length > 0) {
        await message.reply(buildInaccessibleEmojiMessage(inaccessibleEmojiNames));
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
