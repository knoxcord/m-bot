import type { ModalSubmitInteraction} from "discord.js";
import { AttachmentBuilder, MessageFlags } from "discord.js";
import type { IModal} from "./modalTypes.ts";
import { ModalCustomIdPrefix } from "./modalTypes.ts";
import { NewsAddFieldId } from "../../features/communityNews/types.ts";
import { generateLetter } from "../../features/communityNews/letterGenerator/api.ts";
import { buildNewsManageButtonRow } from "../../features/communityNews/builders.ts";

const IMAGE_NAME = "letter.webp";

const handleNewsAddModalSubmit = async (interaction: ModalSubmitInteraction) => {
    const titleText = interaction.fields.getTextInputValue(NewsAddFieldId.Title).trim();
    const bodyText = interaction.fields.getTextInputValue(NewsAddFieldId.Body).trim();

    if (!titleText) {
        await interaction.reply({ content: "You didn't add a title, silly", flags: MessageFlags.Ephemeral });
        return;
    }

    if (!bodyText) {
        await interaction.reply({ content: "You didn't add a body, silly", flags: MessageFlags.Ephemeral });
        return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const response = await generateLetter({
        Title: titleText,
        Body: bodyText,
        Author: interaction.user.displayName
    })

    if (!response) {
        await interaction.editReply("Sorry, I couldn't generate that letter.");
        return;
    }

    const file = new AttachmentBuilder(Buffer.from(await response.arrayBuffer()), { name: IMAGE_NAME });

    // Save to db newsdraft table, return draftId
    const draftId = 0;

    await interaction.editReply({
        files: [file],
        components: [buildNewsManageButtonRow(0)]
    });
};

export const NewsAdd: IModal = {
    customIdPrefix: ModalCustomIdPrefix.NewsAdd,
    handler: handleNewsAddModalSubmit,
};