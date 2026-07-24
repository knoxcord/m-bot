import type { MessageComponentInteraction, TextChannel, MessageCreateOptions } from "discord.js";
import type { SubmissionRow } from "../../../../database/types.ts";
import { SubmissionStatus } from "../../../submissionReview/types.ts";
import { buildAnonymousReplyEmbedFromSubmission } from "./builders.ts";

export const handleAnonymousTopicReply = async (submission: SubmissionRow, reviewInteraction: MessageComponentInteraction) => {
    const guild = reviewInteraction.guild;
    if (!guild)
        return

    if (submission.Status !== SubmissionStatus.Accepted)
        return;

    // It could be argued that the source message isnt really needed for this feature, but
    //   requiring it helps protect against orphaned replies to a deleted topic.
    const sourceMessageId = submission.SourceMessageId;
    if (!sourceMessageId) {
        console.warn(`Expected SourceMessageId on submission associated with topic interaction but instead found ${sourceMessageId}`);
        return;
    }

    const sourceChannelId = submission.SourceChannelId;
    const channel = guild.channels.cache.get(sourceChannelId) as TextChannel | undefined;
    if (!channel) return;
    
    const messageOptions: MessageCreateOptions = {
        embeds: [buildAnonymousReplyEmbedFromSubmission(submission)],
        allowedMentions: { parse: [] },
        reply: { messageReference: sourceMessageId }
    }

    try {
        await channel.send(messageOptions);
    }
    catch (e) {
        console.error(`Encountered error when attempting to post topic interaction response ${e}`);
    }
}