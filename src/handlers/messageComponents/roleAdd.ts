import { LabelBuilder, MessageComponentInteraction, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { IMessageComponent, MessageComponentCustomIdPrefix } from "./messageComponentTypes.js";
import { ModalCustomId } from "../modals/modalTypes.js";

const RoleAddFieldId = "roleAddNumber";

const handler = async (interaction: MessageComponentInteraction) => {
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
