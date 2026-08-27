import type { GuildForumTag } from "discord.js";
import { TextInputBuilder, TextInputStyle, LabelBuilder, ModalBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { ModalCustomIdPrefix } from "../../handlers/modals/modalTypes.ts";
import type { NewsDraftRow } from "../../database/types.ts";
import type { CommunityNewsTagPicker } from "./channel.ts";
import { LetterImageName, NewsAddButtonIds, NewsMessageCustomIdKey, NewsAddFieldId } from "./types.ts";

export const buildNewsAddModal = (tagPicker: CommunityNewsTagPicker | null) =>
    buildNewsModal(ModalCustomIdPrefix.NewsAdd, "Draft Community News", tagPicker);

export const buildNewsEditModal = (draft: NewsDraftRow, tagPicker: CommunityNewsTagPicker | null) =>
    buildNewsModal(`${ModalCustomIdPrefix.NewsEdit}:${draft.Id}`, "Edit Community News", tagPicker, draft);

// Letters are posted as a rendered image, so anything Discord would normally turn into markup is
//   drawn literally as the characters that were typed.
const NewsModalExplainer = [
    "Your news is drawn onto a letter and posted as an image, so it's plain text only:",
    "• Links won't be clickable",
    "• Mentions like <@user> and #channel won't link to anyone or anywhere",
    "• Custom emoji and formatting like \\*\\*bold\\*\\* won't render",
    "• Images can't be attached",
].map(line => `-# ${line}`).join("\n");

const NewsModalSubmitNote = "-# You'll get a preview to check over, and nothing is posted until you hit Post.";

const buildTagSelectOption = (tag: GuildForumTag, selectedTagId: string | null) => {
    const option = new StringSelectMenuOptionBuilder()
        .setLabel(tag.name)
        .setValue(tag.id)
        .setDefault(tag.id === selectedTagId);

    if (tag.emoji?.id || tag.emoji?.name)
        option.setEmoji({ id: tag.emoji.id ?? undefined, name: tag.emoji.name ?? undefined });

    return option;
};

const buildTagLabelComponent = (tagPicker: CommunityNewsTagPicker, selectedTagId: string | null) => {
    const select = new StringSelectMenuBuilder()
        .setCustomId(NewsAddFieldId.Tag)
        .setRequired(tagPicker.required)
        .setMinValues(tagPicker.required ? 1 : 0)
        .setMaxValues(1)
        .addOptions(...tagPicker.tags.map(tag => buildTagSelectOption(tag, selectedTagId)));

    return new LabelBuilder()
        .setLabel("Tag")
        .setDescription(tagPicker.required
            ? "Choose a tag for the post"
            : "You can choose a tag for this post if you'd like")
        .setStringSelectMenuComponent(select);
};

const buildNewsModal = (customId: string, title: string, tagPicker: CommunityNewsTagPicker | null, draft?: NewsDraftRow) => {
    const titleTextInput = new TextInputBuilder()
        .setCustomId(NewsAddFieldId.Title)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(35);
    if (draft)
        titleTextInput.setValue(draft.Title);
    const titleTextComponent = new LabelBuilder()
        .setLabel("Title")
        .setDescription("Pick a short, descriptive, title")
        .setTextInputComponent(titleTextInput);

    const bodyTextInput = new TextInputBuilder()
        .setCustomId(NewsAddFieldId.Body)
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(300);
    if (draft)
        bodyTextInput.setValue(draft.Body);
    const bodyTextComponent = new LabelBuilder()
        .setLabel("Body")
        .setDescription("Add a brief message sharing community news")
        .setTextInputComponent(bodyTextInput);

    const modal = new ModalBuilder()
        .setCustomId(customId)
        .setTitle(title)
        .addTextDisplayComponents(
            component => component.setContent(NewsModalExplainer)
        )
        .addLabelComponents(titleTextComponent)
        .addLabelComponents(bodyTextComponent);

    if (tagPicker?.tags.length)
        modal.addLabelComponents(buildTagLabelComponent(tagPicker, draft?.TagId ?? null));

    modal.addTextDisplayComponents(
        component => component.setContent(NewsModalSubmitNote)
    );

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
            .setCustomId(`${NewsMessageCustomIdKey}:${NewsAddButtonIds.EditText}:${newsDraftId}`)
            .setLabel("Edit Text")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`${NewsMessageCustomIdKey}:${NewsAddButtonIds.Post}:${newsDraftId}`)
            .setLabel("Post")
            .setStyle(ButtonStyle.Primary));

// The letter image carries the title, body and author already, but mods review by reading text,
//   so the embed repeats them alongside the rendered letter attached to the same message.
export const buildNewsSubmissionReviewEmbed = (draft: NewsDraftRow, tag?: GuildForumTag) => {
    const embed = new EmbedBuilder()
        .setTitle(draft.Title)
        .setDescription(draft.Body)
        .setColor(0xBBBB00)
        .setImage(`attachment://${LetterImageName}`)
        .addFields({ name: "Submitted by", value: `<@${draft.AuthorUserId}>`, inline: true });

    // A tag can decide whether the post ends up locked, so it belongs in front of whoever
    //   approves it.
    if (tag)
        embed.addFields({ name: "Tag", value: tag.name, inline: true });

    return embed;
};
