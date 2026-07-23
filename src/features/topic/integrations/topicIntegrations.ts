import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { TopicIntegrationDefinition } from "../types.ts";
import { TopicIntegrationKey, TopicIntegrationStartCustomIdKey } from "../types.ts";

/**
 * Registry of topic integrations — trigger metadata only (label + button).
 * Each integration's actual behaviour lives in its own code; this registry just lets a
 * topic advertise which integration it carries.
 */
const integrations: Record<TopicIntegrationKey, TopicIntegrationDefinition> = {
    [TopicIntegrationKey.AnonymousPost]: {
        key: TopicIntegrationKey.AnonymousPost,
        displayName: "Anonymous Post",
        buttonLabel: "Submit anonymously",
        buttonEmoji: "🕵️",
    },
};

export const getTopicIntegration = (key: TopicIntegrationKey | null | undefined): TopicIntegrationDefinition | undefined =>
    key && key in integrations ? integrations[key] : undefined;

/** Options for the integration select in the advanced topic modal (the "None" option is added by the builder). */
export const listTopicIntegrationChoices = () =>
    Object.values(integrations).map(integration => ({ name: integration.displayName, value: integration.key }));

/** Button rendered under a posted topic that carries an integration. */
export const buildTopicIntegrationRow = (integration: TopicIntegrationDefinition) => {
    const button = new ButtonBuilder()
        .setCustomId(`${TopicIntegrationStartCustomIdKey}:${integration.key}`)
        .setLabel(integration.buttonLabel)
        .setStyle(ButtonStyle.Primary);
    if (integration.buttonEmoji) button.setEmoji(integration.buttonEmoji);
    return new ActionRowBuilder<ButtonBuilder>().setComponents(button);
};
