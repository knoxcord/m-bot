import { EmbedBuilder, type ChatInputCommandInteraction, type MessageComponentInteraction, type ModalSubmitInteraction, type TextChannel } from "discord.js";
import configuration from "../../features/configuration/configuration.ts";
import { TopicLogChannelIdConfigurationKey } from "../../features/topic/config.ts";
import type { TopicIntegrationKey } from "./types.ts";
import { getTopicIntegration } from "./integrations/topicIntegrations.ts";

type TopicLogInteraction = ModalSubmitInteraction | MessageComponentInteraction | ChatInputCommandInteraction;

const getLogChannel = (interaction: TopicLogInteraction, guildId: string) => {
    const logChannelId = configuration.getConfigurationValue(guildId, TopicLogChannelIdConfigurationKey);
    if (!logChannelId) return;

    return interaction.guild?.channels.cache.get(logChannelId) as TextChannel | undefined;
}

export const logTopicCreate = async (interaction: ModalSubmitInteraction, guildId: string, topicText: string, topicIntegrationKey: TopicIntegrationKey | null) => {
    const logChannel = getLogChannel(interaction, guildId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle("New topic added")
        .setColor(0x00AA00)
        .addFields(
            { name: "Topic text", value: topicText },
        );

    const topicIntegration = getTopicIntegration(topicIntegrationKey);
    if (topicIntegration) {
        embed.addFields(
            { name: "Integration", value: topicIntegration.displayName, inline: true },
        );
    }
    embed.addFields({ name: "Added by", value: `<@${interaction.user.id}>` });


    await logChannel.send({ embeds: [embed] });
};

export interface TopicEditChanges {
    text?: { previous: string; next: string };
    integration?: { previous: string; next: string };
}

export const logTopicEdit = async (interaction: TopicLogInteraction, guildId: string, changes: TopicEditChanges) => {
    const logChannel = getLogChannel(interaction, guildId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle("Topic edited")
        .setColor(0xBBBB00);

    if (changes.text) {
        embed.addFields(
            { name: "Previous text", value: changes.text.previous },
            { name: "New text", value: changes.text.next },
        );
    }
    if (changes.integration) {
        embed.addFields(
            { name: "Previous integration", value: changes.integration.previous, inline: true },
            { name: "New integration", value: changes.integration.next, inline: true },
        );
    }
    embed.addFields({ name: "Edited by", value: `<@${interaction.user.id}>` });

    await logChannel.send({ embeds: [embed] });
}

export const logTopicDelete = async (interaction: TopicLogInteraction, guildId: string, topicText: string, topicIntegrationKey: TopicIntegrationKey | null) => {
    const logChannel = getLogChannel(interaction, guildId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle("Topic deleted")
        .setColor(0xAA0000)
        .addFields(
            { name: "Topic text", value: topicText },
        );

    const topicIntegration = getTopicIntegration(topicIntegrationKey);
    if (topicIntegration)
    {
        embed.addFields(
            { name: "Integration", value: topicIntegration.displayName, inline: true },
        );
    }

    embed.addFields({ name: "Deleted by", value: `<@${interaction.user.id}>` });

    await logChannel.send({ embeds: [embed] });
}
