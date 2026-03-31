import { LabelBuilder, MessageComponentInteraction, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { IMessageComponent, MessageComponentCustomIdPrefix } from "./messageComponentTypes.js";
import { ModalCustomId } from "../modals/modalTypes.js";
import db from "../../database/db.js";
import config from "../../config.json" with { type: "json" }

const RoleAddFieldId = "roleAddNumber";

const handleExisingSubmission = async (interaction: MessageComponentInteraction, existingSubmissionScore: number) => {
    if (!interaction.guildId || !interaction.guild)
        return;
    
    console.info(`Reassigning role to already known userid: ${interaction.user.id} in guildId: ${interaction.guildId}`);
    const authorUser = await interaction.guild?.members.fetch(interaction.user.id);

    if (existingSubmissionScore >= 90) {
        await authorUser.roles.add(config.MonkRoleId);
    } else if (existingSubmissionScore >= 80) {
        await authorUser.roles.add(config.NormieRoleId);
    } else {
        await authorUser.roles.add(config.PerformerRoleId);
    }

    await authorUser.roles.remove(config.UnsortedRoleId);
    await interaction.reply({ content: "Your result is already known. You may now leave this channel.", flags: MessageFlags.Ephemeral })
}

const handler = async (interaction: MessageComponentInteraction) => {
    if (!interaction.guildId || !interaction.guild)
        return;

    // See if we already have a score for the user
    // This can happen if they leave and rejoin the server
    const exisingSubmission = db.getScoreSubmissionForUser(interaction.guildId, interaction.user.id);
    if (exisingSubmission)
        return handleExisingSubmission(interaction, exisingSubmission.Score);

    const modal = new ModalBuilder()
        .setCustomId(ModalCustomId.RoleAdd)
        .setTitle("Submit Result")
        .addTextDisplayComponents(
            builder => builder.setContent("You will only be able to submit once, so be honest.")
        )
        .addLabelComponents(
            new LabelBuilder()
                .setLabel("Enter your numeric result here:")
                .setTextInputComponent(
                    new TextInputBuilder()
                        .setCustomId(RoleAddFieldId)
                        .setPlaceholder("e.g. 42")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                )
        );

    await interaction.showModal(modal);
};

export { RoleAddFieldId };

export const RoleAdd: IMessageComponent = {
    customIdPrefix: MessageComponentCustomIdPrefix.RoleAdd,
    handler: handler
};
