import type { ModalSubmitInteraction} from "discord.js";
import { AttachmentBuilder, MessageFlags } from "discord.js";
import type { IModal} from "./modalTypes.ts";
import { ModalCustomIdPrefix } from "./modalTypes.ts";
import { LetterImageName, NewsAddFieldId } from "../../features/communityNews/types.ts";
import { rollValediction } from "../../features/communityNews/valedictions.ts";
import { generateLetter } from "../../features/communityNews/letterGenerator/api.ts";
import { buildNewsManageButtonRow } from "../../features/communityNews/builders.ts";
import { getCommunityNewsTagPicker } from "../../features/communityNews/channel.ts";
import { readSubmittedTagId } from "../../features/communityNews/tagField.ts";
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

    const tagId = readSubmittedTagId(interaction, getCommunityNewsTagPicker(interaction)) ?? null;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const valediction = rollValediction(interaction.user.displayName);

    const letter = await generateLetter({
        Title: titleText,
        Body: bodyText,
        Valediction: valediction
    })

    if (!letter) {
        await interaction.editReply("Sorry, I couldn't generate that letter.");
        return;
    }

    const file = new AttachmentBuilder(letter.image, { name: LetterImageName });

    const draftId = db.createNewsDraft({
        guildId: interaction.guildId,
        authorUserId: interaction.user.id,
        valediction: valediction,
        title: titleText,
        body: bodyText,
        image: letter.image,
        stationery: letter.stationery,
        tagId: tagId,
    });

    await interaction.editReply({
        content: "Here is a preview of your news post. When you're satisfied, hit \"Post\" to send it!",
        files: [file],
        components: [buildNewsManageButtonRow(draftId)]
    });
};

export const NewsAdd: IModal = {
    customIdPrefix: ModalCustomIdPrefix.NewsAdd,
    handler: handleNewsAddModalSubmit,
};
