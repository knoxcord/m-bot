import type { MessageComponentInteraction } from "discord.js";
import { AttachmentBuilder, MessageFlags } from "discord.js";
import { LetterImageName, NewsAddButtonIds } from "../../features/communityNews/types.ts";
import { buildNewsEditModal, buildNewsSubmissionReviewEmbed } from "../../features/communityNews/builders.ts";
import { loadEditableDraft, redrawLetter } from "../../features/communityNews/draftEditing.ts";
import { getCommunityNewsChannel, getCommunityNewsTagPicker } from "../../features/communityNews/channel.ts";
import { postNews, serializeCommunityNewsSubmissionPayload } from "../../features/communityNews/postNews.ts";
import { createSubmission } from "../../features/submissionReview/submission.ts";
import { SubmissionType } from "../../features/submissionReview/types.ts";
import { rollValediction } from "../../features/communityNews/valedictions.ts";
import db from "../../database/db.ts";
import type { IMessageComponent} from "./messageComponentTypes.ts";
import { MessageComponentCustomIdPrefix } from "./messageComponentTypes.ts";
import featureFlags from "../../features/featureFlags/featureFlags.ts";
import { RequireCommunityNewsSubmissionReviewFeatureFlag } from "../../features/communityNews/config.ts";

// Leave stationery undefined so the generator picks a new one
const changeBackground = (interaction: MessageComponentInteraction, guildId: string, draftId: number) =>
    redrawLetter(interaction, guildId, draftId, () => ({}));

// Include current stationery and new valediction so only valediction changes
const changeValediction = (interaction: MessageComponentInteraction, guildId: string, draftId: number) =>
    redrawLetter(interaction, guildId, draftId, draft => ({
        stationery: draft.Stationery,
        valediction: rollValediction(interaction.user.displayName, draft.Valediction),
    }));

const editText = async (interaction: MessageComponentInteraction, guildId: string, draftId: number) => {
    const draft = await loadEditableDraft(interaction, guildId, draftId);
    if (!draft) return;

    await interaction.showModal(buildNewsEditModal(draft, getCommunityNewsTagPicker(interaction)));
}

const confirmPost = async (message: string, interaction: MessageComponentInteraction) => {
    // Drop the buttons so the sent draft can't be rerolled or resubmitted, but keep the letter visible.
    await interaction.editReply({ components: [] });
    await interaction.followUp({
        content: message,
        flags: MessageFlags.Ephemeral,
    });
}

const post = async (interaction: MessageComponentInteraction, guildId: string, draftId: number) => {
    const draft = await loadEditableDraft(interaction, guildId, draftId);
    if (!draft) return;

    // Checked up front so the author finds out now rather than after a mod approves something
    //   and the bot then can't post anywhere.
    const communityNewsChannel = getCommunityNewsChannel(interaction);
    if (!communityNewsChannel) {
        await interaction.reply({
            content: "Community news isn't set up on this server yet — ask an admin to configure the news channel.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const tagPicker = getCommunityNewsTagPicker(interaction);
    if (tagPicker?.required && !draft.TagId) {
        await interaction.reply({
            content: tagPicker.tags.length
                ? "The news forum needs every post to have a tag — hit \"Edit Text\" to pick one."
                : "The news forum needs every post to have a tag, but it doesn't offer any you can pick. Ask an admin.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    // Claim before the awaits below so a double-click can't produce two posts/submissions.
    if (db.claimNewsDraftForSubmission(draftId).changes < 1) {
        await interaction.reply({ content: "That draft has already been sent.", flags: MessageFlags.Ephemeral });
        return;
    }

    // Wait to defer update until after db operations in case something fails and replies first
    await interaction.deferUpdate();

    const requireSubmissionReview = featureFlags.getFeatureFlag(guildId, RequireCommunityNewsSubmissionReviewFeatureFlag);
    if (!requireSubmissionReview) {
        let postLink: string;
        try {
            postLink = await postNews(communityNewsChannel, draft);
        } catch (e) {
            console.error(`Encountered error when attempting to post community news draft ${draft.Id}: ${e}`);
            db.releaseNewsDraftClaim(draftId);
            await interaction.followUp({ content: "Something went wrong posting the news.", flags: MessageFlags.Ephemeral });
            return;
        }

        await confirmPost(`Thanks! Your news has been posted [here](${postLink}).`, interaction);
        return;
    }

    const tag = tagPicker?.tags.find(availableTag => availableTag.id === draft.TagId);
    const submissionId = await createSubmission(
        SubmissionType.CommunityNews,
        serializeCommunityNewsSubmissionPayload(draftId),
        interaction,
        () => buildNewsSubmissionReviewEmbed(draft, tag),
        [new AttachmentBuilder(draft.Image, { name: LetterImageName })],
    );

    if (!submissionId) {
        // createSubmission already told the author what went wrong; let them try again.
        db.releaseNewsDraftClaim(draftId);
        return;
    }

    db.setNewsDraftSubmissionId(draftId, submissionId);
    await confirmPost("Thanks! Your news has been sent to the mods for review.", interaction);
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
        case NewsAddButtonIds.EditText:
            return editText(interaction, guildId, draftId);
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
