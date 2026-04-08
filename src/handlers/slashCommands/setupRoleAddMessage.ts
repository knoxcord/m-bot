import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction, hyperlink, MessageFlags, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { CommandKey, ISlashCommand } from "./commandTypes.js";
import { RoleAddCustomIdKey } from "../messageComponents/messageComponentTypes.js";

const Key = CommandKey.SetupRoleAddMessage;
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
            .setCustomId(RoleAddCustomIdKey)
            .setLabel("Submit Result")
            .setStyle(ButtonStyle.Primary)
    );

    await targetChannel.send({
        content: `Take ${hyperlink("this quiz", "https://www.performativepuritytest.com/")} then click the button below to submit your result`,
        components: [actionRow]
    });

    await interaction.reply({ content: `Submit Result message posted to <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
};

export const SetupRoleAddMessage: ISlashCommand = {
    builder: builder,
    handler: handler,
    key: Key
};
