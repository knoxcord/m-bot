import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import { IModal, ModalCustomId } from "./modalTypes.js";
import { RoleAddFieldId } from "../messageComponents/roleAdd.js";
import database from "../../database/db.js";
import { assignRole, sendWelcomeMessage } from "../../features/autoRole/autoRole.js";

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
    await sendWelcomeMessage(authorUser, newRole, interaction.guild);
    await interaction.reply({ content: "Result accepted. You may now leave this channel.", flags: MessageFlags.Ephemeral });
};

export const RoleAdd: IModal = {
    customId: ModalCustomId.RoleAdd,
    handler: handler
};
