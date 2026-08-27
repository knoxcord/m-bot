import type { ModalSubmitInteraction } from "discord.js";
import type { CommunityNewsTagPicker } from "./channel.ts";
import { NewsAddFieldId } from "./types.ts";

/**
 * Reads the forum tag select from a news modal submission, checked against the tags the forum
 * offers so only a tag an author may actually apply is stored.
 * - `undefined` when the field is absent (the news channel isn't a forum with pickable tags) —
 *   leave the draft's tag untouched.
 * - `null` when nothing is selected, or the selection isn't a tag an author may apply.
 * - the tag id otherwise.
 */
export const readSubmittedTagId = (
    interaction: ModalSubmitInteraction,
    tagPicker: CommunityNewsTagPicker | null,
): string | null | undefined => {
    let values: readonly string[];
    try {
        values = interaction.fields.getStringSelectValues(NewsAddFieldId.Tag);
    } catch {
        return undefined;
    }

    const value = values[0];
    if (!value) return null;

    return tagPicker?.tags.some(tag => tag.id === value) ? value : null;
};
