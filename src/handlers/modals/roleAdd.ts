import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import { IModal, ModalCustomId } from "./modalTypes.js";
import { RoleAddFieldId } from "../messageComponents/roleAdd.js";

const handler = async (interaction: ModalSubmitInteraction) => {
    if (!interaction.guild)
        return;

    const value = interaction.fields.getTextInputValue(RoleAddFieldId);
    const parsed = Number(value);

    if (isNaN(parsed) || !Number.isInteger(parsed)) {
        await interaction.reply({ content: "Please enter a valid whole number.", flags: MessageFlags.Ephemeral });
        return;
    }

    const authorUser = await interaction.guild.members.fetch(interaction.user.id);
    if (parsed >= 80 && parsed < 90) {
        authorUser.roles.add('1487906985855942656');
    } else if (parsed >= 60 && parsed < 70) {
        authorUser.roles.add('1487907079149584476');
    }

    await interaction.reply({ content: `You entered: ${parsed}`, flags: MessageFlags.Ephemeral });
};

export const RoleAdd: IModal = {
    customId: ModalCustomId.RoleAdd,
    handler: handler
};
