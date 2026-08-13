import { TextInputBuilder, TextInputStyle, LabelBuilder, ModalBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { ModalCustomIdPrefix } from "../../handlers/modals/modalTypes.ts";
import type { NewsDraftRow } from "../../database/types.ts";
import { LetterImageName, NewsAddButtonIds, NewsAddFieldId, NewsMessageCustomIdKey } from "./types.ts";

export const buildNewsAddModal = () => {
    const titleTextInput = new TextInputBuilder()
        .setCustomId(NewsAddFieldId.Title)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(35);
    const titleTextComponent = new LabelBuilder()
        .setLabel("Title")
        .setDescription("Pick a short, descriptive, title")
        .setTextInputComponent(titleTextInput);

    const bodyTextInput = new TextInputBuilder()
        .setCustomId(NewsAddFieldId.Body)
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(300);
    const bodyTextComponent = new LabelBuilder()
        .setLabel("Body")
        .setDescription("Add a brief message sharing community news")
        .setTextInputComponent(bodyTextInput);

    const modal = new ModalBuilder()
        .setCustomId(ModalCustomIdPrefix.NewsAdd)
        .setTitle("Add Community News")
        .addLabelComponents(titleTextComponent)
        .addLabelComponents(bodyTextComponent);
    return modal;
};

export const buildNewsManageButtonRow = (newsDraftId: number) =>
    new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setCustomId(`${NewsMessageCustomIdKey}:${NewsAddButtonIds.ChangeBackground}:${newsDraftId}`)
            .setLabel("Change Background")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`${NewsMessageCustomIdKey}:${NewsAddButtonIds.ChangeValediction}:${newsDraftId}`)
            .setLabel("Change Sign-off")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`${NewsMessageCustomIdKey}:${NewsAddButtonIds.Post}:${newsDraftId}`)
            .setLabel("Post")
            .setStyle(ButtonStyle.Primary));

// The letter image carries the title, body and author already, but mods review by reading text,
//   so the embed repeats them alongside the rendered letter attached to the same message.
export const buildNewsSubmissionReviewEmbed = (draft: NewsDraftRow) =>
    new EmbedBuilder()
        .setTitle(draft.Title)
        .setDescription(draft.Body)
        .setColor(0xBBBB00)
        .setImage(`attachment://${LetterImageName}`)
        .addFields({ name: "Submitted by", value: `<@${draft.AuthorUserId}>`, inline: true });
