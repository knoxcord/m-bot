import type { MessageComponentInteraction } from "discord.js";
import type { IMessageComponent} from "./messageComponentTypes.ts";
import { MessageComponentCustomIdPrefix } from "./messageComponentTypes.ts";
import db from "../../database/db.ts";
import { NextOrPrev, TarotCardReversedIndicator } from "../../features/tarot/types.ts";
import { buildTarotActionRow, buildTarotDisplay } from "../../features/tarot/builders.ts";
import { deck } from "../../features/tarot/deck.ts";

const handler = async (interaction: MessageComponentInteraction) => {
    const messageId = interaction.message.id;
    const pullData = db.getPullResult(messageId);

    if (!pullData) {
        // This shouldnt happen
        console.warn(`Failed to retrieve db entry for message component ${messageId}`);
        return;
    }
    
    // TODO: Consider moving this customId data extraction to the tarot domain
    // Tarot message component customId format is tarot:["Next" or "Previous"]:[current card key]
    const [_, nextOrPrev, currentCardKey] = interaction.customId.split(":");
    const pulledCardKeys = pullData.split(",");
    const currentIndex = pulledCardKeys.findIndex(cardKey => cardKey === currentCardKey);
    const newIndex = nextOrPrev === NextOrPrev.Next ? currentIndex + 1 : currentIndex - 1;

    const newCardKey = pulledCardKeys[newIndex];
    const isReversed = newCardKey.startsWith(TarotCardReversedIndicator);
    const newCardId = isReversed ? newCardKey.slice(TarotCardReversedIndicator.length) : newCardKey;
    const newCard = deck.find(card => card.id === newCardId);

    if (!newCard) {
        // This shouldnt happen
        console.warn(`Failed to retrieve card matching id ${newCardId}`);
        return;
    }
    newCard.isReversed = isReversed;

    const embed = buildTarotDisplay(newCard, newIndex, pulledCardKeys.length);
    const actionRow = buildTarotActionRow(newCard, newIndex, pulledCardKeys.length);

    await interaction.update({
        embeds: [embed],
        components: [actionRow],
        flags: interaction.message.flags.bitfield
    })
}

export const TarotComponent: IMessageComponent = {
    customIdPrefix: MessageComponentCustomIdPrefix.Tarot,
    handler: handler
}
