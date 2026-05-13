import type { ModalSubmitInteraction } from "discord.js";
import { EmbedBuilder, MessageFlags } from "discord.js";
import type { IModal } from "./modalTypes.ts";
import { ModalCustomIdPrefix } from "./modalTypes.ts";
import topics from "../../features/topic/topics.ts";
import { TopicEditFieldId } from "../../features/topic/types.ts";
import { buildInaccessibleEmojiMessage, findInaccessibleCustomEmoji } from "../../features/topic/emojiValidation.ts";

const handleTopicEditModalSubmit = async (interaction: ModalSubmitInteraction) => {
    const [, topicIdRaw] = interaction.customId.split(":");
    const topicId = Number(topicIdRaw);
    const guildId = interaction.guildId ?? "";

    if (!Number.isFinite(topicId)) {
        await interaction.reply({ content: "Invalid topic id.", flags: MessageFlags.Ephemeral });
        return;
    }

    const existing = topics.getTopic(guildId, topicId);
    if (!existing) {
        await interaction.reply({ content: "Topic not found.", flags: MessageFlags.Ephemeral });
        return;
    }

    const newText = interaction.fields.getTextInputValue(TopicEditFieldId.TopicText).trim();
    if (!newText) {
        await interaction.reply({ content: "Topic text can't be empty.", flags: MessageFlags.Ephemeral });
        return;
    }

    const inaccessibleEmojiNames = findInaccessibleCustomEmoji(newText, interaction.client);
    if (inaccessibleEmojiNames.length > 0) {
        await interaction.reply({ content: buildInaccessibleEmojiMessage(inaccessibleEmojiNames), flags: MessageFlags.Ephemeral });
        return;
    }

    if (newText === existing.Topic) {
        await interaction.reply({ content: "No changes to save.", flags: MessageFlags.Ephemeral });
        return;
    }

    topics.updateTopicText(guildId, topicId, newText);

    const embed = new EmbedBuilder()
        .setTitle("Updated Topic")
        .setColor(0x00AA00)
        .addFields(
            { name: "Previous text", value: existing.Topic },
            { name: "New text", value: newText },
        );

    await interaction.reply({ embeds: [embed] });
};

export const TopicEdit: IModal = {
    customIdPrefix: ModalCustomIdPrefix.TopicEdit,
    handler: handleTopicEditModalSubmit,
};
