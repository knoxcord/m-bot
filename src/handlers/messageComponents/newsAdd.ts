import type { MessageComponentInteraction } from "discord.js";
import { AttachmentBuilder, MessageFlags } from "discord.js";
import { LetterImageName, NewsAddButtonIds } from "../../features/communityNews/types.ts";
import { generateLetter } from "../../features/communityNews/letterGenerator/api.ts";
import { buildNewsManageButtonRow, buildNewsSubmissionReviewEmbed } from "../../features/communityNews/builders.ts";
import {
    getCommunityNewsChannel,
    serializeCommunityNewsSubmissionPayload,
} from "../../features/communityNews/submissionReviewHandler.ts";
import { createSubmission } from "../../features/submissionReview/submission.ts";
import { SubmissionType } from "../../features/submissionReview/types.ts";
import { rollValediction } from "../../features/communityNews/valedictions.ts";
import type { NewsDraftRow } from "../../database/types.ts";
import db from "../../database/db.ts";
import type { IMessageComponent} from "./messageComponentTypes.ts";
import { MessageComponentCustomIdPrefix } from "./messageComponentTypes.ts";

const loadEditableDraft = async (interaction: MessageComponentInteraction, guildId: string, draftId: number) => {
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
 * time round; anything it leaves out stays as the draft already has it.
 */
const redrawLetter = async (
    interaction: MessageComponentInteraction,
    guildId: string,
    draftId: number,
    change: (draft: NewsDraftRow) => { stationery?: string; valediction?: string },
) => {
    const draft = await loadEditableDraft(interaction, guildId, draftId);
    if (!draft) return;

    // Wait to defer update until after loading draft from the db in case load fails and replies first
    await interaction.deferUpdate();

    const { stationery, valediction } = change(draft);

    const letter = await generateLetter({
        Title: draft.Title,
        Body: draft.Body,
        Valediction: valediction ?? draft.Valediction,
        Stationery: stationery,
    })

    if (!letter) {
        await interaction.followUp({ content: "Sorry, I couldn't generate that letter.", flags: MessageFlags.Ephemeral });
        return;
    }

    db.updateNewsDraftRender(draftId, { image: letter.image, stationery: letter.stationery, valediction });

    await interaction.editReply({
        // The replacement reuses the same file name, so the old attachment has to be dropped explicitly.
        attachments: [],
        files: [new AttachmentBuilder(letter.image, { name: LetterImageName })],
        components: [buildNewsManageButtonRow(draftId)]
    });
}

// Leave stationery undefined so the generator picks a new one
const changeBackground = (interaction: MessageComponentInteraction, guildId: string, draftId: number) =>
    redrawLetter(interaction, guildId, draftId, () => ({}));

// Include current stationery and new valediction so only valediction changes
const changeValediction = (interaction: MessageComponentInteraction, guildId: string, draftId: number) =>
    redrawLetter(interaction, guildId, draftId, draft => ({
        stationery: draft.Stationery ?? undefined,
        valediction: rollValediction(interaction.user.displayName, draft.Valediction),
    }));

const post = async (interaction: MessageComponentInteraction, guildId: string, draftId: number) => {
    const draft = await loadEditableDraft(interaction, guildId, draftId);
    if (!draft) return;

    // Checked up front so the author finds out now rather than after a mod approves something
    //   and the bot then can't post anywhere.
    if (!getCommunityNewsChannel(interaction)) {
        await interaction.reply({
            content: "Community news isn't set up on this server yet — ask an admin to configure the news channel.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    // Claim before the awaits below so a double-click can't produce two submissions.
    if (db.claimNewsDraftForSubmission(draftId).changes < 1) {
        await interaction.reply({ content: "That draft has already been sent to the mods for review.", flags: MessageFlags.Ephemeral });
        return;
    }

    // Wait to defer update until after db operations in case something fails and replies first
    await interaction.deferUpdate();

    const submissionId = await createSubmission(
        SubmissionType.CommunityNews,
        serializeCommunityNewsSubmissionPayload(draftId),
        interaction,
        () => buildNewsSubmissionReviewEmbed(draft),
        [new AttachmentBuilder(draft.Image, { name: LetterImageName })],
    );

    if (!submissionId) {
        // createSubmission already told the author what went wrong; let them try again.
        db.releaseNewsDraftClaim(draftId);
        return;
    }

    db.setNewsDraftSubmissionId(draftId, submissionId);

    // Drop the buttons so the sent draft can't be rerolled or resubmitted, but keep the letter visible.
    await interaction.editReply({ components: [] });
    await interaction.followUp({
        content: "Thanks! Your news has been sent to the mods for review.",
        flags: MessageFlags.Ephemeral,
    });
}

const handler = async (interaction: MessageComponentInteraction) => {
    const [, action, draftIdRaw] = interaction.customId.split(":");
    const draftId = Number(draftIdRaw);
    const guildId = interaction.guildId ?? "";

    if (!Number.isFinite(draftId)) {
        console.warn(`Invalid news draft id: ${draftId}`);
        return;
    }

    switch (action) {
        case NewsAddButtonIds.ChangeBackground:
            return changeBackground(interaction, guildId, draftId);
        case NewsAddButtonIds.ChangeValediction:
            return changeValediction(interaction, guildId, draftId);
        case NewsAddButtonIds.Post:
            return post(interaction, guildId, draftId);
        default:
            console.warn(`Invalid news add action: ${action}`);
    }
};

export const NewsAddComponent: IMessageComponent = {
    customIdPrefix: MessageComponentCustomIdPrefix.NewsAdd,
    handler: handler,
};
