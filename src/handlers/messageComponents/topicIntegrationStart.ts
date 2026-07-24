import type { MessageComponentInteraction } from "discord.js";
import type { IMessageComponent } from "./messageComponentTypes.ts";
import { MessageComponentCustomIdPrefix } from "./messageComponentTypes.ts";
import { buildAnonymousSubmitModal } from "../../features/topic/integrations/anonymousSubmit/builders.ts";
import { deriveIdentity } from "../../features/topic/integrations/anonymousSubmit/anonymousIdentity.ts";
import { TopicIntegrationKey } from "../../features/topic/integrations/types.ts";

// An integration button under a posted topic was pressed. Dispatch by key to that integration.
const handler = async (interaction: MessageComponentInteraction) => {
    const [, integrationKey] = interaction.customId.split(":");

    switch (integrationKey) {
        case TopicIntegrationKey.AnonymousReply: {
            // Seed matches what the submission will store (submitter + this topic message), so the
            // codename previewed here is exactly the one the posted reply will use.
            const { codename } = deriveIdentity(interaction.user.id, interaction.message.id);
            await interaction.showModal(buildAnonymousSubmitModal(interaction.message.content, codename));
            return;
        }
        default:
            console.warn(`Unknown topic integration on start: ${integrationKey}`);
    }
};

export const TopicIntegrationStartComponent: IMessageComponent = {
    customIdPrefix: MessageComponentCustomIdPrefix.TopicIntegrationStart,
    handler,
};
