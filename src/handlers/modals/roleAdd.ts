import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import { IModal, ModalCustomId } from "./modalTypes.js";
import { RoleAddFieldId } from "../messageComponents/roleAdd.js";
import database from "../../database/db.js";
import { assignRole, getWelcomeMessage } from "../../features/autoRole/autoRole.js";
import config from "../../config.json" with { type: "json" }

const handler = async (interaction: ModalSubmitInteraction) => {
    if (!interaction.guild)
        return;

    const value = interaction.fields.getTextInputValue(RoleAddFieldId);
    const parsed = Number(value);

    if (isNaN(parsed) || !Number.isInteger(parsed)) {
        await interaction.reply({ content: "Please enter a valid whole number.", flags: MessageFlags.Ephemeral });
        return;
    }

    database.saveScoreSubmission(interaction.guild.id, interaction.user.id, parsed);

    const authorUser = await interaction.guild.members.fetch(interaction.user.id);
    const newRole = await assignRole(authorUser, parsed);

    let welcomeChannelId: string | undefined;
    switch(newRole) {
        case config.monkRoleId:
            welcomeChannelId = config.monkChannelId;
            break;
        case config.normieRoleId:
            welcomeChannelId = config.normieChannelId;
            break;
        case config.performerRoleId:
            welcomeChannelId = config.performerChannelId;
            break;
    };
    const welcomeChannel = welcomeChannelId ? await interaction.guild.channels.fetch(welcomeChannelId) : undefined;
    if (welcomeChannel && welcomeChannel.isTextBased()) {
        try {
            await welcomeChannel.send(getWelcomeMessage(authorUser));
        } catch (error) {
            console.error(`Failed to send welcome message to channel ${welcomeChannelId}:`, error);
        }
    }

    await interaction.reply({ content: "Result accepted. You may now leave this channel.", flags: MessageFlags.Ephemeral });
};

export const RoleAdd: IModal = {
    customId: ModalCustomId.RoleAdd,
    handler: handler
};
