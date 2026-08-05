import type { MessageComponentInteraction } from "discord.js";
import { AttachmentBuilder } from "discord.js";
import { NewsAddButtonIds } from "../../features/communityNews/types.ts";
import { generateLetter } from "../../features/communityNews/letterGenerator/api.ts";
import { buildNewsManageButtonRow } from "../../features/communityNews/builders.ts";
import type { IMessageComponent} from "./messageComponentTypes.ts";
import { MessageComponentCustomIdPrefix } from "./messageComponentTypes.ts";

const IMAGE_NAME = "letter.webp";

const changeBackground = async (interaction: MessageComponentInteraction, guildId: string, draftId: number) => {
    interaction.deferReply();
    
    // TODO: Load title and body from the backend
    const title = "title";
    const body = "body";

    const response = await generateLetter({
        Title: title,
        Body: body,
        Author: interaction.user.displayName
    })

    if (!response) {
        await interaction.editReply("Sorry, I couldn't generate that letter.");
        return;
    }

    const file = new AttachmentBuilder(Buffer.from(await response.arrayBuffer()), { name: IMAGE_NAME });

    // TODO: update db newsdraft table with new image

    await interaction.editReply({
        files: [file],
        components: [buildNewsManageButtonRow(draftId)]
    });
}

const post = async (interaction: MessageComponentInteraction, guildId: string, draftId: number) => {
    // TODO: load draft data (title, body)

    // TODO: Create submission
}

const handler = async (interaction: MessageComponentInteraction) => {
    const [, action, draftIdRaw] = interaction.customId.split(":");
    const draftId = Number(draftIdRaw);
    const guildId = interaction.guildId ?? "";

    if (!Number.isFinite(draftId)) {
        console.warn(`Invalid news draft id: ${draftId}`);
        return;
    }

    switch (action) {
        case NewsAddButtonIds.ChangeBackground:
            return changeBackground(interaction, guildId, draftId);
        case NewsAddButtonIds.Post:
            return post(interaction, guildId, draftId);
        default:
            console.warn(`Invalid news add action: ${action}`);
    }
};

export const TopicManageComponent: IMessageComponent = {
    customIdPrefix: MessageComponentCustomIdPrefix.NewsAdd,
    handler: handler,
};
