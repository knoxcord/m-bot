import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction, ChatInputCommandInteraction} from "discord.js";
import { EmbedBuilder, MessageFlags, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import type { ISlashCommand } from "./commandTypes.ts";
import { CommandKey } from "./commandTypes.ts";
import topics from "../../features/topic/topics.ts";
import { formatAutocompleteName } from "../../shared/autocompleteOptionFormatter.ts";
import { buildTopicEditModal, buildTopicInfoEmbed } from "../../features/topic/builders.ts";

const Key = CommandKey.TopicManage;

enum TopicManageSubcommand {
    Remove = "remove",
    Get = "get",
    Edit = "edit",
}

const builder = new SlashCommandBuilder()
    .setName(Key)
    .setDescription("Manages Topics")
    .addSubcommand(subcommand => 
        subcommand
            .setName(TopicManageSubcommand.Get)
            .setDescription("Get information about a topic")
            .addIntegerOption(option =>
                option.setName("topic")
                    .setDescription("The topic to get (search by text)")
                    .setRequired(true)
                    .setAutocomplete(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName(TopicManageSubcommand.Remove)
            .setDescription("Remove a topic")
            .addIntegerOption(option =>
                option.setName("topic")
                    .setDescription("The topic to remove (search by text)")
                    .setRequired(true)
                    .setAutocomplete(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName(TopicManageSubcommand.Edit)
            .setDescription("Edit a topic's text via a modal")
            .addIntegerOption(option =>
                option.setName("topic")
                    .setDescription("The topic to edit (search by text)")
                    .setRequired(true)
                    .setAutocomplete(true)))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);

const handleGet = async (interaction: ChatInputCommandInteraction) => {
    const topicId = interaction.options.getInteger("topic", true);
    const guildId = interaction.guildId ?? "";
    const topic = topics.getTopic(guildId, topicId);

    if (!topic) {
        await interaction.reply({ content: `Topic not found.`, flags: MessageFlags.Ephemeral });
        return;
    }

    const embed = buildTopicInfoEmbed(topic, guildId);

    await interaction.reply({ embeds: [embed] });
};

const handleRemove = async (interaction: ChatInputCommandInteraction) => {
    const topicId = interaction.options.getInteger("topic", true);
    const guildId = interaction.guildId ?? "";
    const topic = topics.getTopic(guildId, topicId);

    if (!topic) {
        await interaction.reply({ content: `Topic not found.`, flags: MessageFlags.Ephemeral });
        return;
    }

    topics.removeTopic(topic.GuildId, topic.Id);

    const embed = new EmbedBuilder()
        .setTitle("Removed Topic")
        .setColor(0xFF0000)

    embed.addFields({ name: "Topic text", value: topic.Topic });
    embed.addFields({ name: "Added by", value: `<@${topic.AddedByUserId}>`, inline: true });
    embed.addFields({ name: "Created date", value: `<t:${Math.floor(new Date(`${topic.CreatedAt}Z`).getTime() / 1000)}:f>`, inline: true });

    await interaction.reply({ embeds: [embed] });
};


const handleEdit = async (interaction: ChatInputCommandInteraction) => {
    const topicId = interaction.options.getInteger("topic", true);
    const guildId = interaction.guildId ?? "";
    const topic = topics.getTopic(guildId, topicId);

    if (!topic) {
        await interaction.reply({ content: `Topic not found.`, flags: MessageFlags.Ephemeral });
        return;
    }

    await interaction.showModal(buildTopicEditModal(topic.Id, topic.Topic));
};

const topicManageHandler = async (interaction: ChatInputCommandInteraction) => {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case TopicManageSubcommand.Get:
            await handleGet(interaction);
            break;
        case TopicManageSubcommand.Remove:
            await handleRemove(interaction);
            break;
        case TopicManageSubcommand.Edit:
            await handleEdit(interaction);
            break;
    }
};

const topicAutocompleteHandler = async (interaction: AutocompleteInteraction) => {
    const focusedValue = interaction.options.getFocused();
    const guildId = interaction.guildId ?? "";
    const results = topics.searchTopics(guildId, focusedValue);

    await interaction.respond(
        results.map(topic => <ApplicationCommandOptionChoiceData<number>>({
            name: formatAutocompleteName(topic.Topic),
            value: topic.Id,
        }))
    );
};

export const TopicManage: ISlashCommand = {
    builder: builder,
    handler: topicManageHandler,
    autocompleteHandler: topicAutocompleteHandler,
    key: Key
}
