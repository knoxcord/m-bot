import type { MessageComponentInteraction } from "discord.js"
import type { SubmissionRow } from "../../database/types.ts"
import { SubmissionType } from "./types.ts"
import { topicIntegrationSubmissionReviewHandler } from "../topic/integrations/submissionReviewHandler.ts"
import { communityNewsSubmissionReviewHandler } from "../communityNews/postNews.ts"

export type SubmissionReviewHandler = (submission: SubmissionRow, reviewInteraction: MessageComponentInteraction) => Promise<void>

const submissionReviewHandlers: Record<SubmissionType, SubmissionReviewHandler> = {
    [SubmissionType.TopicIntegration]: topicIntegrationSubmissionReviewHandler,
    [SubmissionType.CommunityNews]: communityNewsSubmissionReviewHandler
}

export const handleSubmissionReview = (submission: SubmissionRow, reviewInteraction: MessageComponentInteraction) =>
    submissionReviewHandlers[submission.Type](submission, reviewInteraction);