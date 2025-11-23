import { ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { FieldId, ICard, NextOrPrev, PullType, TarotCustomIdKey  } from "./types.js";
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
        .setDescription("The text you enter here is private and will not be included in public results")
        .setTextInputComponent(tarotPurposeInput);
}

const getTarotPullTypeInput = () => {
    const tarotPullTypeInput = new StringSelectMenuBuilder()
        .setCustomId(FieldId.PullType)
        .setOptions(
            new StringSelectMenuOptionBuilder().setLabel("One").setDescription("Single card pull").setValue(PullType.Single),
            new StringSelectMenuOptionBuilder().setLabel("Two").setDescription("Double card pull").setValue(PullType.Double),
            new StringSelectMenuOptionBuilder().setLabel("Three").setDescription("Three card pull").setValue(PullType.Triple).setDefault()
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


export const buildTarotDisplay = (displayedCard: ICard, displayIndex: number, numberOfCards: number) => {
    // Build response
    const container = new ContainerBuilder()
        .setAccentColor(displayedCard.color)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(displayedCard.name),
            textDisplay => textDisplay.setContent(displayedCard.reversed === true ? "Reversed" : "Upright"),
            textDisplay => textDisplay.setContent(displayedCard.meaning)
        );

    // If multiple cards were pulled add buttons to iterate through them
    if (numberOfCards > 1) {
        const cardKey = getKey(displayedCard);
        container.addActionRowComponents<ButtonBuilder>(
            actionRow => actionRow.setComponents(
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
            )
        );
    }

    return container;
}
