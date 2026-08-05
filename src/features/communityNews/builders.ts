import { TextInputBuilder, TextInputStyle, LabelBuilder, ModalBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import { ModalCustomIdPrefix } from "../../handlers/modals/modalTypes.ts";
import { NewsAddButtonIds, NewsAddFieldId, NewsNewBackgroundButtonId } from "./types.ts";

export const buildNewsAddModal = () => {
    const titleTextInput = new TextInputBuilder()
        .setCustomId(NewsAddFieldId.Title)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(40);
    const titleTextComponent = new LabelBuilder()
        .setLabel("Title")
        .setTextInputComponent(titleTextInput);

    const bodyTextInput = new TextInputBuilder()
        .setCustomId(NewsAddFieldId.Body)
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(300);
    const bodyTextComponent = new LabelBuilder()
        .setLabel("Body")
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
            .setCustomId(`${NewsAddButtonIds.ChangeBackground}:${newsDraftId}`)
            .setLabel("Change Background")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`${NewsAddButtonIds.Post}:${newsDraftId}`)
            .setLabel("Post")
            .setStyle(ButtonStyle.Primary));
