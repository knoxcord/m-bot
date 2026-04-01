import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction, MessageFlags, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { CommandKey, ISlashCommand } from "./commandTypes.js";
import { PresetRoleCustomIdKey } from "../messageComponents/messageComponentTypes.js";

const Key = CommandKey.SetupPresetRoleMessage;
const Description = "Posts a Submit Role message with a button to a specified channel";

const builder = new SlashCommandBuilder()
    .setName(Key)
    .setDescription(Description)
    .addChannelOption(option =>
        option
            .setName("channel")
            .setDescription("The channel to post the Submit Result message to")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);

const handler = async (interaction: ChatInputCommandInteraction) => {
    const channel = interaction.options.getChannel("channel", true);

    const targetChannel = await interaction.guild?.channels.fetch(channel.id);
    if (!targetChannel || !targetChannel.isTextBased()) {
        await interaction.reply({ content: "Invalid text channel.", flags: MessageFlags.Ephemeral });
        return;
    }

    const actionRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setCustomId(PresetRoleCustomIdKey)
            .setLabel("I Accept")
            .setStyle(ButtonStyle.Primary)
    );

    await targetChannel.send({
        content: `Welcome. Your fate is known. Click below to get started.`,
        components: [actionRow]
    });

    await interaction.reply({ content: `Preset Result message posted to <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
};

export const SetupPresetRoleMessage: ISlashCommand = {
    builder: builder,
    handler: handler,
    key: Key
};
