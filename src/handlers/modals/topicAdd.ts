import type { ModalSubmitInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import type { IModal } from "./modalTypes.ts";
import { ModalCustomIdPrefix } from "./modalTypes.ts";
import topics from "../../features/topic/topics.ts";
import { TopicEditFieldId } from "../../features/topic/types.ts";
import { buildInaccessibleEmojiMessage, findInaccessibleCustomEmoji } from "../../features/topic/emojiValidation.ts";
import { buildTopicManageButtonRow } from "../../features/topic/builders.ts";
import { readSubmittedIntegrationKey } from "../../features/topic/integrations/integrationField.ts";
import { logTopicCreate } from "../../features/topic/logTopic.ts";

const handleTopicAddModalSubmit = async (interaction: ModalSubmitInteraction) => {
    const guildId = interaction.guildId ?? "";
    const topicText = interaction.fields.getTextInputValue(TopicEditFieldId.TopicText).trim();

    if (!topicText) {
        await interaction.reply({ content: "You didn't add a topic, silly", flags: MessageFlags.Ephemeral });
        return;
    }

    const inaccessibleEmojiNames = findInaccessibleCustomEmoji(topicText, interaction.client);
    if (inaccessibleEmojiNames.length > 0) {
        await interaction.reply({ content: buildInaccessibleEmojiMessage(inaccessibleEmojiNames), flags: MessageFlags.Ephemeral });
        return;
    }

    const integrationKey = readSubmittedIntegrationKey(interaction) ?? null;
    const topicId = topics.addTopic(guildId, topicText, interaction.user.id, integrationKey);

    await interaction.reply({
        content: `Added topic:\n${topicText}`,
        components: [buildTopicManageButtonRow(topicId)],
        flags: MessageFlags.Ephemeral,
    });

    await logTopicCreate(interaction, guildId, topicText, integrationKey);
};

export const TopicAdd: IModal = {
    customIdPrefix: ModalCustomIdPrefix.TopicAdd,
    handler: handleTopicAddModalSubmit,
};
