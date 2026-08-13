import type { MessageComponentInteraction, ModalMessageModalSubmitInteraction } from "discord.js";
import { AttachmentBuilder, MessageFlags } from "discord.js";
import { LetterImageName } from "./types.ts";
import { generateLetter } from "./letterGenerator/api.ts";
import { buildNewsManageButtonRow } from "./builders.ts";
import type { NewsDraftRow } from "../../database/types.ts";
import db from "../../database/db.ts";

/** Interactions that can edit the ephemeral draft message: message buttons and modals opened from them. */
export type DraftInteraction = MessageComponentInteraction | ModalMessageModalSubmitInteraction;

export const loadEditableDraft = async (interaction: DraftInteraction, guildId: string, draftId: number) => {
    const draft = db.getNewsDraft(draftId);

    if (!draft || draft.GuildId !== guildId || draft.AuthorUserId !== interaction.user.id) {
        await interaction.reply({ content: "I couldn't find that news draft.", flags: MessageFlags.Ephemeral });
        return null;
    }

    if (draft.SubmittedAt) {
        await interaction.reply({ content: "That draft has already been sent to the mods for review.", flags: MessageFlags.Ephemeral });
        return null;
    }

    return draft;
}

/**
 * Redraws a draft's letter, replacing the attachment in place. `change` decides what differs this
 * time around; anything it leaves out stays as the draft already has it.
 */
export const redrawLetter = async (
    interaction: DraftInteraction,
    guildId: string,
    draftId: number,
    change: (draft: NewsDraftRow) => { stationery?: string; valediction?: string; title?: string; body?: string },
) => {
    const draft = await loadEditableDraft(interaction, guildId, draftId);
    if (!draft) return;

    // Wait to defer update until after loading draft from the db in case load fails and replies first
    await interaction.deferUpdate();

    const { stationery, valediction, title, body } = change(draft);

    const letter = await generateLetter({
        Title: title ?? draft.Title,
        Body: body ?? draft.Body,
        Valediction: valediction ?? draft.Valediction,
        Stationery: stationery,
    })

    if (!letter) {
        await interaction.followUp({ content: "Sorry, I couldn't generate that letter.", flags: MessageFlags.Ephemeral });
        return;
    }

    db.updateNewsDraft(draftId, { image: letter.image, stationery: letter.stationery, valediction, title, body });

    await interaction.editReply({
        // The replacement reuses the same file name, so the old attachment has to be dropped explicitly.
        attachments: [],
        files: [new AttachmentBuilder(letter.image, { name: LetterImageName })],
        components: [buildNewsManageButtonRow(draftId)]
    });
}
