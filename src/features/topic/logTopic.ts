import { EmbedBuilder, type MessageComponentInteraction, type ModalSubmitInteraction, type TextChannel } from "discord.js";
import configuration from "../../features/configuration/configuration.ts";
import { TopicLogChannelIdConfigurationKey } from "../../features/topic/config.ts";

const getLogChannel = (interaction: ModalSubmitInteraction | MessageComponentInteraction, guildId: string) => {
    const logChannelId = configuration.getConfigurationValue(guildId, TopicLogChannelIdConfigurationKey);
    if (!logChannelId) return;

    return interaction.guild?.channels.cache.get(logChannelId) as TextChannel | undefined;
}

export const logTopicCreate = async (interaction: ModalSubmitInteraction, guildId: string, topicText: string) => {
    const logChannel = getLogChannel(interaction, guildId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle("New topic added")
        .setColor(0x00AA00)
        .addFields(
            { name: "Topic text", value: topicText },
            { name: "Added by", value: `<@${interaction.user.id}>` }
        );

    await logChannel.send({ embeds: [embed] });
};

export const logTopicEdit = async (interaction: ModalSubmitInteraction, guildId: string, newText: string, previousText: string) => {
    const logChannel = getLogChannel(interaction, guildId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle("Topic edited")
        .setColor(0xBBBB00)
        .addFields(
            { name: "Previous text", value: previousText },
            { name: "New text", value: newText },
            { name: "Edited by", value: `<@${interaction.user.id}>` }
        );

    await logChannel.send({ embeds: [embed] });
}

export const logTopicDelete = async (interaction: MessageComponentInteraction, guildId: string, topicText: string) => {
    const logChannel = getLogChannel(interaction, guildId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle("Topic deleted")
        .setColor(0xAA0000)
        .addFields(
            { name: "Topic text", value: topicText },
            { name: "Deleted by", value: `<@${interaction.user.id}>` }
        );

    await logChannel.send({ embeds: [embed] });
}
