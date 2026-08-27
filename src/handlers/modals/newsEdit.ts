import type { ModalSubmitInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import type { IModal} from "./modalTypes.ts";
import { ModalCustomIdPrefix } from "./modalTypes.ts";
import { NewsAddFieldId } from "../../features/communityNews/types.ts";
import { redrawLetter } from "../../features/communityNews/draftEditing.ts";
import { getCommunityNewsTagPicker } from "../../features/communityNews/channel.ts";
import { readSubmittedTagId } from "../../features/communityNews/tagField.ts";

const handleNewsEditModalSubmit = async (interaction: ModalSubmitInteraction) => {
    // The modal is opened from a button on the draft message, so its submit can update that message.
    if (!interaction.guildId || !interaction.isFromMessage())
        return;

    const [, draftIdRaw] = interaction.customId.split(":");
    const draftId = Number(draftIdRaw);

    if (!Number.isFinite(draftId)) {
        console.warn(`Invalid news draft id: ${draftIdRaw}`);
        return;
    }

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

    const tagId = readSubmittedTagId(interaction, getCommunityNewsTagPicker(interaction));

    // Include current stationery and valediction so only the text changes
    await redrawLetter(interaction, interaction.guildId, draftId, draft => ({
        stationery: draft.Stationery,
        valediction: draft.Valediction,
        title: titleText,
        body: bodyText,
        tagId: tagId,
    }));
};

export const NewsEdit: IModal = {
    customIdPrefix: ModalCustomIdPrefix.NewsEdit,
    handler: handleNewsEditModalSubmit,
};
