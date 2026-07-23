import type { MessageComponentInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import type { IMessageComponent } from "./messageComponentTypes.ts";
import { MessageComponentCustomIdPrefix } from "./messageComponentTypes.ts";
import topics from "../../features/topic/topics.ts";
import { TopicManageAction } from "../../features/topic/types.ts";
import { buildTopicDeleteConfirmRow, buildTopicEditModal, buildTopicManageButtonRow } from "../../features/topic/builders.ts";
import { logTopicDelete } from "../../features/topic/logTopic.ts";

// Edit: open the edit modal prefilled with the current topic text.
const edit = async (interaction: MessageComponentInteraction, guildId: string, topicId: number) => {
    const topic = topics.getTopic(guildId, topicId);
    if (!topic) {
        await interaction.reply({ content: "Topic not found.", flags: MessageFlags.Ephemeral });
        return;
    }

    await interaction.showModal(buildTopicEditModal(topic));
};

// Delete: replace the manage buttons with a confirmation prompt in place.
const promptDelete = async (interaction: MessageComponentInteraction, topicId: number) => {
    await interaction.update({
        content: `${interaction.message.content}\n\n⚠️ Are you sure you want to delete this topic?`,
        components: [buildTopicDeleteConfirmRow(topicId)],
    });
};

// Confirm: delete the topic, update the ephemeral message, and log the deletion.
const confirmDelete = async (interaction: MessageComponentInteraction, guildId: string, topicId: number) => {
    const topic = topics.getTopic(guildId, topicId);
    if (!topic) {
        await interaction.update({ content: "Topic not found. It may have already been deleted.", components: [] });
        return;
    }

    topics.removeTopic(guildId, topicId, interaction.user.id);

    await interaction.update({
        content: `🗑️ Topic deleted:\n${topic.Topic}`,
        components: [],
    });

    await logTopicDelete(interaction, guildId, topic.Topic, topic.IntegrationKey);
};

// Cancel: restore the original manage buttons.
const cancelDelete = async (interaction: MessageComponentInteraction, guildId: string, topicId: number) => {
    const topic = topics.getTopic(guildId, topicId);
    if (!topic) {
        await interaction.update({ content: "Topic not found. It may have already been deleted.", components: [] });
        return;
    }

    await interaction.update({
        content: `Added topic:\n${topic.Topic}`,
        components: [buildTopicManageButtonRow(topicId)],
    });
};

const handler = async (interaction: MessageComponentInteraction) => {
    const [, action, topicIdRaw] = interaction.customId.split(":");
    const topicId = Number(topicIdRaw);
    const guildId = interaction.guildId ?? "";

    if (!Number.isFinite(topicId)) {
        console.warn(`Invalid topic manage id: ${topicIdRaw}`);
        return;
    }

    switch (action) {
        case TopicManageAction.Edit:
            return edit(interaction, guildId, topicId);
        case TopicManageAction.Delete:
            return promptDelete(interaction, topicId);
        case TopicManageAction.ConfirmDelete:
            return confirmDelete(interaction, guildId, topicId);
        case TopicManageAction.CancelDelete:
            return cancelDelete(interaction, guildId, topicId);
        default:
            console.warn(`Invalid topic manage action: ${action}`);
    }
};

export const TopicManageComponent: IMessageComponent = {
    customIdPrefix: MessageComponentCustomIdPrefix.TopicManage,
    handler: handler,
};
