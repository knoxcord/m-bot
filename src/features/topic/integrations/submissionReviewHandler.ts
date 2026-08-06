import type { MessageComponentInteraction } from "discord.js";
import type { TopicIntegrationSubmissionPayload } from "./types.ts";
import { TopicIntegrationType } from "./types.ts";
import type { SubmissionRow } from "../../../database/types.ts";
import { handleAnonymousTopicReply } from "./anonymousSubmit/handler.ts";

export const serializeTopicIntegrationSubmissionPayload = (payload: TopicIntegrationSubmissionPayload) =>
    JSON.stringify(payload);

const deserializeTopicIntegrationSubmissionPayload = (payload: string) => {
    let parsed: TopicIntegrationSubmissionPayload;
    try {
        parsed = JSON.parse(payload);
    }
    catch (e) {
        console.error(`Failed to parse topic integration submission payload: ${payload} with error: ${e}`);
        return null;
    }
    return parsed;
}

export const topicIntegrationSubmissionReviewHandler = async (submission: SubmissionRow, reviewInteraction: MessageComponentInteraction) => {
    const payload = deserializeTopicIntegrationSubmissionPayload(submission.Payload);
    if (!payload)
        return;

    if (payload.TopicIntegrationType == TopicIntegrationType.AnonymousSubmit)
        await handleAnonymousTopicReply(submission, payload.Content, reviewInteraction);
}