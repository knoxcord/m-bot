import type { ModalSubmitInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import type { IModal } from "./modalTypes.ts";
import { ModalCustomIdPrefix } from "./modalTypes.ts";
import topics from "../../features/topic/topics.ts";
import { TopicEditFieldId } from "../../features/topic/types.ts";
import { buildInaccessibleEmojiMessage, findInaccessibleCustomEmoji } from "../../features/topic/emojiValidation.ts";
import { buildTopicManageButtonRow } from "../../features/topic/builders.ts";
import { readSubmittedIntegrationKey } from "../../features/topic/integrations/integrationField.ts";
import { getTopicIntegration } from "../../features/topic/integrations/topicIntegrations.ts";
import type { TopicEditChanges } from "../../features/topic/logTopic.ts";
import { logTopicEdit } from "../../features/topic/logTopic.ts";
import type { TopicIntegrationKey } from "../../features/topic/integrations/types.ts";

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

    const textChanged = newText !== existing.Topic;

    // The integration select is only present on the advanced modal. If undefined, don't change it
    const submittedIntegration = readSubmittedIntegrationKey(interaction);
    const integrationChanged = submittedIntegration !== undefined && submittedIntegration !== existing.IntegrationKey;

    if (!textChanged && !integrationChanged) {
        await interaction.reply({ content: "No changes to save.", flags: MessageFlags.Ephemeral });
        return;
    }

    if (textChanged) topics.updateTopicText(guildId, topicId, newText);
    if (integrationChanged) topics.setTopicIntegration(guildId, topicId, submittedIntegration);

    const describeIntegration = (key: TopicIntegrationKey | null) => getTopicIntegration(key)?.displayName ?? "None";
    const changes: TopicEditChanges = {};
    if (textChanged) changes.text = { previous: existing.Topic, next: newText };
    if (integrationChanged) {
        changes.integration = {
            previous: describeIntegration(existing.IntegrationKey),
            next: describeIntegration(submittedIntegration),
        };
    }

    // When launched from the ephemeral "Added topic" message (edit button), update that message
    //   in place. Otherwise (via /topic-manage edit) just acknowledge ephemerally.
    if (interaction.isFromMessage()) {
        await interaction.update({
            content: `Added topic:\n${newText}`,
            components: [buildTopicManageButtonRow(topicId)],
        });
    } else {
        await interaction.reply({ content: "✅ Topic updated.", flags: MessageFlags.Ephemeral });
    }

    // The details go to the configured topic audit channel, not the interaction.
    await logTopicEdit(interaction, guildId, changes);
};

export const TopicEdit: IModal = {
    customIdPrefix: ModalCustomIdPrefix.TopicEdit,
    handler: handleTopicEditModalSubmit,
};
