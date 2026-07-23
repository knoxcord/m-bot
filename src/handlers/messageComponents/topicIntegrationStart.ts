import type { MessageComponentInteraction } from "discord.js";
import type { IMessageComponent } from "./messageComponentTypes.ts";
import { MessageComponentCustomIdPrefix } from "./messageComponentTypes.ts";
import { buildAnonymousSubmitModal } from "../../features/topic/integrations/anonymousSubmit/builders.ts";
import { TopicIntegrationKey } from "../../features/topic/integrations/types.ts";

// An integration button under a posted topic was pressed. Dispatch by key to that integration.
const handler = async (interaction: MessageComponentInteraction) => {
    const [, integrationKey] = interaction.customId.split(":");

    switch (integrationKey) {
        case TopicIntegrationKey.AnonymousReply:
            await interaction.showModal(buildAnonymousSubmitModal());
            return;
        default:
            console.warn(`Unknown topic integration on start: ${integrationKey}`);
    }
};

export const TopicIntegrationStartComponent: IMessageComponent = {
    customIdPrefix: MessageComponentCustomIdPrefix.TopicIntegrationStart,
    handler,
};
