import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction, ChatInputCommandInteraction} from "discord.js";
import { ChannelType, MessageFlags, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import type { ISlashCommand } from "./commandTypes.ts";
import { CommandKey } from "./commandTypes.ts";
import topics from "../../features/topic/topics.ts";
import { formatAutocompleteName } from "../../shared/autocompleteOptionFormatter.ts";
import { buildTopicAddModal, buildTopicEditModal, buildTopicInfoEmbed, buildTopicMessage } from "../../features/topic/builders.ts";
import { logTopicDelete } from "../../features/topic/logTopic.ts";

const Key = CommandKey.TopicManage;

enum TopicManageSubcommand {
    Add = "add",
    Post = "post",
    Remove = "remove",
    Get = "get",
    Edit = "edit",
    ResetLastShown = "reset-last-shown",
}

const builder = new SlashCommandBuilder()
    .setName(Key)
    .setDescription("Manages Topics")
    .addSubcommand(subcommand =>
        subcommand
            .setName(TopicManageSubcommand.Add)
            .setDescription("Add a topic via a modal with advanced configuration options"))
    .addSubcommand(subcommand =>
        subcommand
            .setName(TopicManageSubcommand.Post)
            .setDescription("Post a specific topic now (defaults to this channel)")
            .addIntegerOption(option =>
                option.setName("topic")
                    .setDescription("The topic to post (search by text)")
                    .setRequired(true)
                    .setAutocomplete(true))
            .addChannelOption(option =>
                option.setName("channel")
                    .setDescription("Channel to post in (defaults to this channel)")
                    .addChannelTypes(
                        ChannelType.GuildText,
                        ChannelType.GuildAnnouncement,
                        ChannelType.PublicThread,
                        ChannelType.PrivateThread,
                        ChannelType.AnnouncementThread,
                    )
                    .setRequired(false)))
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
            .setDescription("Edit a topic's text via a modal wth advanced configuration options")
            .addIntegerOption(option =>
                option.setName("topic")
                    .setDescription("The topic to edit (search by text)")
                    .setRequired(true)
                    .setAutocomplete(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName(TopicManageSubcommand.ResetLastShown)
            .setDescription("Clear a topic's last shown time and decrement its shown count")
            .addIntegerOption(option =>
                option.setName("topic")
                    .setDescription("The topic to reset (search by text)")
                    .setRequired(true)
                    .setAutocomplete(true)))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);

const handleAdd = async (interaction: ChatInputCommandInteraction) => {
    await interaction.showModal(buildTopicAddModal(true));
};

const handlePost = async (interaction: ChatInputCommandInteraction) => {
    const topicId = interaction.options.getInteger("topic", true);
    const guildId = interaction.guildId ?? "";

    // Defaults to the invoking channel; the channel option (if given) is fetched to a full channel.
    const channelOption = interaction.options.getChannel("channel");
    const channel = channelOption
        ? await interaction.client.channels.fetch(channelOption.id).catch(() => null)
        : interaction.channel;

    if (!channel || !channel.isTextBased() || !('send' in channel)) {
        await interaction.reply({ content: "This topic can't be posted in that channel.", flags: MessageFlags.Ephemeral });
        return;
    }

    // Marks the topic shown (bumps count + last-shown, like the auto/random post paths).
    const topic = topics.markTopicShown(guildId, topicId);
    if (!topic) {
        await interaction.reply({ content: `Topic not found.`, flags: MessageFlags.Ephemeral });
        return;
    }

    const postedMessage = await channel.send(buildTopicMessage(topic));
    await interaction.reply({ content: `✅ Posted topic: https://discord.com/channels/${postedMessage.guildId}/${postedMessage.channelId}/${postedMessage.id}`, flags: MessageFlags.Ephemeral });
};

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

    await interaction.reply({ content: "🗑️ Topic removed.", flags: MessageFlags.Ephemeral });
    await logTopicDelete(interaction, guildId, topic.Topic, topic.IntegrationKey);
};


const handleEdit = async (interaction: ChatInputCommandInteraction) => {
    const topicId = interaction.options.getInteger("topic", true);
    const guildId = interaction.guildId ?? "";
    const topic = topics.getTopic(guildId, topicId);

    if (!topic) {
        await interaction.reply({ content: `Topic not found.`, flags: MessageFlags.Ephemeral });
        return;
    }

    await interaction.showModal(buildTopicEditModal(topic, true));
};

const handleResetLastShown = async (interaction: ChatInputCommandInteraction) => {
    const topicId = interaction.options.getInteger("topic", true);
    const guildId = interaction.guildId ?? "";
    const topic = topics.getTopic(guildId, topicId);

    if (!topic) {
        await interaction.reply({ content: `Topic not found.`, flags: MessageFlags.Ephemeral });
        return;
    }

    const updated = topics.resetTopicLastShown(guildId, topicId);

    if (!updated) {
        await interaction.reply({ content: `Topic not found.`, flags: MessageFlags.Ephemeral });
        return;
    }

    const embed = buildTopicInfoEmbed(updated, guildId);

    await interaction.reply({ embeds: [embed] });
};

const topicManageHandler = async (interaction: ChatInputCommandInteraction) => {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case TopicManageSubcommand.Add:
            await handleAdd(interaction);
            break;
        case TopicManageSubcommand.Post:
            await handlePost(interaction);
            break;
        case TopicManageSubcommand.Get:
            await handleGet(interaction);
            break;
        case TopicManageSubcommand.Remove:
            await handleRemove(interaction);
            break;
        case TopicManageSubcommand.Edit:
            await handleEdit(interaction);
            break;
        case TopicManageSubcommand.ResetLastShown:
            await handleResetLastShown(interaction);
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
