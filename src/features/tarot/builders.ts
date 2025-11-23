import { ActionRowBuilder, APIEmbedField, ButtonBuilder, ButtonStyle, EmbedBuilder, LabelBuilder, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { FieldId, ICard, NextOrPrev, PullType, TarotCustomIdKey, TarotImagesPath  } from "./types.js";
import { ModalCustomId } from "../../handlers/modals/modalTypes.js";
import { getKey } from "./helpers.js";

const examplePurposes = [
    "Tell me about my future",
    "Will today be a good day?",
    "Should I quit my job?"
]
const getPurposePlaceholder = () => examplePurposes[Math.floor(Math.random() * examplePurposes.length)]

const getTarotPurposeInput = () => {
    const tarotPurposeInput = new TextInputBuilder()
        .setCustomId(FieldId.Purpose)
        .setPlaceholder(getPurposePlaceholder())
        .setStyle(TextInputStyle.Short)
        .setRequired(false);
    return new LabelBuilder()
        .setLabel("What are you pulling for?")
        .setDescription("The text you enter here will influence deck shuffling but will not be posted publicly")
        .setTextInputComponent(tarotPurposeInput);
}

const getTarotPullTypeInput = () => {
    const tarotPullTypeInput = new StringSelectMenuBuilder()
        .setCustomId(FieldId.PullType)
        .setOptions(
            new StringSelectMenuOptionBuilder().setLabel("One").setDescription("Single card pull").setValue(PullType.Single),
            new StringSelectMenuOptionBuilder().setLabel("Two").setDescription("Double card pull").setValue(PullType.Double),
            new StringSelectMenuOptionBuilder().setLabel("Three").setDescription("Triple card pull").setValue(PullType.Triple).setDefault()
        )
        .setRequired(false);
    return new LabelBuilder()
        .setLabel("How Many Cards?")
        .setStringSelectMenuComponent(tarotPullTypeInput);
}

const getTarotIncludeReversedInput = () => {
    const tarotIncludeReversedInput = new StringSelectMenuBuilder()
        .setCustomId(FieldId.IncludeReversed)
        .setOptions(
            new StringSelectMenuOptionBuilder().setLabel("Yes").setDescription("Pulled cards can include reversals").setValue("true").setDefault(),
            new StringSelectMenuOptionBuilder().setLabel("No").setDescription("Pulled cards will be upright only").setValue("false"),
        )
        .setRequired(false)
    return new LabelBuilder()
        .setLabel("Include Reversals")
        .setStringSelectMenuComponent(tarotIncludeReversedInput);
}

const getTarotIsPublicInput = () => {
    const tarotIsPublicInput = new StringSelectMenuBuilder()
        .setCustomId(FieldId.IsPublic)
        .setOptions(
            new StringSelectMenuOptionBuilder().setLabel("Yes").setDescription("Posts the tarot pull publicly").setValue("true").setDefault(),
            new StringSelectMenuOptionBuilder().setLabel("No").setDescription("Posts the tarot pull privately").setValue("false")
        )
        .setRequired(false);
    return new LabelBuilder()
        .setLabel("Post Result Publicly?")
        .setStringSelectMenuComponent(tarotIsPublicInput);
}
export const buildTarotModal = () => new ModalBuilder()
    .setCustomId(ModalCustomId.Tarot)
    .setTitle("New Tarot Read")
    .addLabelComponents(
        getTarotPurposeInput(),
        getTarotPullTypeInput(),
        getTarotIncludeReversedInput(),
        getTarotIsPublicInput(),
    );


export const buildTarotDisplay = (displayedCard: ICard) => {
    const imageSrc = `${TarotImagesPath}${displayedCard.isReversed ? displayedCard.reversedImageSlug : displayedCard.uprightImageSlug}`;

    const fields: APIEmbedField[] = [];
    if (displayedCard.element)
        fields.push({ name: 'Element', value: displayedCard.element, inline: true })
    if (displayedCard.sign)
        fields.push({ name: 'Sign', value: displayedCard.sign, inline: true })
    if (displayedCard.quality)
        fields.push({ name: 'Quality', value: displayedCard.quality, inline: true })
    if (displayedCard.planet)
        fields.push({ name: 'Planet', value: displayedCard.planet, inline: true })

    const embed = new EmbedBuilder()
        .setColor(displayedCard.color)
        .setTitle(`${displayedCard.name}${displayedCard.isReversed ? " (Reversed)" : ""}`)
        .setDescription(`Meaning keywords: ${displayedCard.isReversed ? displayedCard.reversedKeywords : displayedCard.uprightKeywords}`)
        .addFields(fields)
        .setURL(displayedCard.isReversed ? displayedCard.reversedMeaningLink : displayedCard.uprightMeaningLink)
        .setImage(imageSrc)

    return embed;
}

export const buildTarotActionRow = (displayedCard: ICard, displayIndex: number, numberOfCards: number) => {
    const cardKey = getKey(displayedCard);
    return new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setCustomId(`${TarotCustomIdKey}:${NextOrPrev.Previous}:${cardKey}`)
            .setLabel("◀ Prev Card")
            .setDisabled(displayIndex === 0)
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`${TarotCustomIdKey}:${NextOrPrev.Next}:${cardKey}`)
            .setLabel("Next Card ▶")
            .setDisabled(displayIndex === numberOfCards - 1)
            .setStyle(ButtonStyle.Primary),
    );
}
