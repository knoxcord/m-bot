import type { ModalSubmitInteraction} from "discord.js";
import { AttachmentBuilder, MessageFlags } from "discord.js";
import type { IModal} from "./modalTypes.ts";
import { ModalCustomIdPrefix } from "./modalTypes.ts";
import { LetterImageName, NewsAddFieldId } from "../../features/communityNews/types.ts";
import { ValedictionSelectValue, resolveValediction } from "../../features/communityNews/valedictions.ts";
import { generateLetter } from "../../features/communityNews/letterGenerator/api.ts";
import { buildNewsManageButtonRow } from "../../features/communityNews/builders.ts";
import db from "../../database/db.ts";

const handleNewsAddModalSubmit = async (interaction: ModalSubmitInteraction) => {
    if (!interaction.guildId)
        return;

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

    const [selectedValediction] = interaction.fields.getStringSelectValues(NewsAddFieldId.Valediction);
    const valediction = resolveValediction(selectedValediction ?? ValedictionSelectValue.Random, interaction.user.displayName);

    const response = await generateLetter({
        Title: titleText,
        Body: bodyText,
        Valediction: valediction
    })

    if (!response) {
        await interaction.editReply("Sorry, I couldn't generate that letter.");
        return;
    }

    const image = Buffer.from(await response.arrayBuffer());
    const file = new AttachmentBuilder(image, { name: LetterImageName });

    const draftId = db.createNewsDraft({
        guildId: interaction.guildId,
        authorUserId: interaction.user.id,
        valediction: valediction,
        title: titleText,
        body: bodyText,
        image: image,
    });

    await interaction.editReply({
        files: [file],
        components: [buildNewsManageButtonRow(draftId)]
    });
};

export const NewsAdd: IModal = {
    customIdPrefix: ModalCustomIdPrefix.NewsAdd,
    handler: handleNewsAddModalSubmit,
};
