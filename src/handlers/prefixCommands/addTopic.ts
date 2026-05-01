import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import topics from "../../features/topic/topics.js";
import { OmitPartialGroupDMChannel, Message, inlineCode, GuildMember } from "discord.js";
import { ConfigurationRegistration } from "../../features/configuration/configurationTypes.js";
import configuration from "../../features/configuration/configuration.js";
import { getMissingPermissionResponse } from "../../shared/responses.js";

export const RoleIdsThatCanAddTopicsConfigurationKey = 'ROLE_IDS_THAT_CAN_ADD_TOPICS';
export const addTopicConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Role Ids That Can Add Topics', RoleIdsThatCanAddTopicsConfigurationKey]
];

const addTopicHandler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
    if (!message.guildId || !message.guild)
        return;

    if (!commandBody.trim()) {
        await message.reply("You didn't add a topic, silly");
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
