import type { ModalSubmitInteraction } from "discord.js";
import type { TopicIntegrationKey } from "./types.ts";
import { TopicIntegrationNoneSelectValue } from "./types.ts";
import { TopicEditFieldId } from "../types.ts";

/**
 * Reads the advanced integration select from a topic modal submission, validated against
 * the registry so the result is always a known key (or null/undefined).
 * - `undefined` when the field is absent (the basic /addtopic modal) — leave it untouched.
 * - `null` when "None" is selected (or the value isn't a recognized integration) — clear it.
 * - the integration key otherwise.
 */
export const readSubmittedIntegrationKey = (interaction: ModalSubmitInteraction): TopicIntegrationKey | null | undefined => {
    let values: readonly string[];
    try {
        values = interaction.fields.getStringSelectValues(TopicEditFieldId.IntegrationKey);
    } catch {
        return undefined;
    }

    const value = values[0];
    if (!value || value === TopicIntegrationNoneSelectValue) return null;
    return value as TopicIntegrationKey ?? null;
};
