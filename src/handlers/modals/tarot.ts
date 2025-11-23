import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import { FieldId, PullType, ICard } from "../../features/tarot/types.js";
import { deck } from "../../features/tarot/deck.js";
import db from "../../database/db.js";
import { getKey } from "../../features/tarot/helpers.js";
import { buildTarotDisplay, buildTarotModal } from "../../features/tarot/builders.js";
import { IModal, ModalCustomId } from "./modalTypes.js";

const PullTypeMap: Record<PullType, number> = {
    [PullType.Single]: 1,
    [PullType.Double]: 2,
    [PullType.Triple]: 3
};

// Adapted from: https://bost.ocks.org/mike/shuffle/
const shuffleDeck = (cards: ICard[], includeReversed: boolean = true) => {

    let divisionIndex: number, swapCard: ICard, currentCardIndex: number;
    divisionIndex = cards.length;

    // While there remain elements to shuffle…
    while (divisionIndex) {

        // Pick a random card from the unshuffled portion of the deck
        currentCardIndex = Math.floor(Math.random() * divisionIndex--);

        // Pick the card at the end of the unshuffled section.
        // This position will become the latest shuffled card added to the shuffled deck
        // This card will be swapped into the position of randomly chosed currentCard
        swapCard = cards[divisionIndex];

        // Set the position of the latest shuffled card to the value of the randomly chosen currentCard.
        cards[divisionIndex] = cards[currentCardIndex];

        // Determine if the shuffled card should be reversed
        if (includeReversed)
            cards[divisionIndex].reversed = Math.round(Math.random()) === 1;

        // Set the position of the randomly chosen currentCardIndex to the value of the swapped card
        cards[currentCardIndex] = swapCard;
    }

    return cards;
}

const pullCards = (numberOfCards: number, includeReversed: boolean) => {
    const shuffledDeck = shuffleDeck(deck, includeReversed);
    return shuffledDeck.slice(0, numberOfCards);
}

export const handleTarotModalSubmit = async (interaction: ModalSubmitInteraction) => {
    // Extract field data from integration
    // const purpose = interaction.fields.getTextInputValue(FieldId.Purpose);
    const pullType = interaction.fields.getStringSelectValues(FieldId.PullType)[0] as PullType;
    const includeReversed = interaction.fields.getStringSelectValues(FieldId.IncludeReversed)[0] === "true";
    const isPublic = interaction.fields.getStringSelectValues(FieldId.IsPublic)[0] === "true";
    
    // Pull cards
    const numberOfCards = PullTypeMap[pullType];
    const pulledCards = pullCards(numberOfCards, includeReversed)
    const container = buildTarotDisplay(pulledCards[0], 0, numberOfCards);

    await interaction.reply({
        components: [container],
        flags: isPublic ? MessageFlags.IsComponentsV2 : MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });

    if (pulledCards.length > 1) {
        const message = await interaction.fetchReply();

        // Stringify pulled cards data for storage
        const pullResult = pulledCards.map(getKey).join(",");
        db.savePullResult(message.id, interaction.user.id, pullResult);
    }
}

export const Tarot: IModal = {
    customId: ModalCustomId.Tarot,
    builder: buildTarotModal,
    handler: handleTarotModalSubmit
}