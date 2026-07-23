import type { MessageComponentInteraction } from "discord.js";
import type { TopicIntegrationSubmissionMetadata} from "./types.ts";
import { TopicIntegrationType } from "./types.ts";
import type { SubmissionRow } from "../../../database/types.ts";
import { handleAnonymousTopicReply } from "./anonymousSubmit/handler.ts";

export const serializeTopicIntegrationSubmissionMetadata = (topicIntegrationType: TopicIntegrationType) => {
    const metadata: TopicIntegrationSubmissionMetadata = {
        TopicIntegrationType: topicIntegrationType
    };

    return JSON.stringify(metadata);
}

const deserializeTopicIntegrationSubmissionMetadata = (metadata: string | null) => {
    if (metadata == null) {
        console.error(`Failed to parse topic integration submission metadata: ${metadata}`);
        return null
    }

    let parsed: TopicIntegrationSubmissionMetadata;
    try {
        parsed = JSON.parse(metadata);
    }
    catch (e) {
        console.error(`Failed to parse topic integration submission metadata: ${metadata} with error: ${e}`);
        return null;
    }
    return parsed;
}

export const topicIntegrationSubmissionReviewHandler = async (submission: SubmissionRow, reviewInteraction: MessageComponentInteraction) => {
    const metadata = deserializeTopicIntegrationSubmissionMetadata(submission.Metadata);
    if (!metadata)
        return;

    if (metadata.TopicIntegrationType == TopicIntegrationType.AnonymousSubmit)
        await handleAnonymousTopicReply(submission, reviewInteraction);
}