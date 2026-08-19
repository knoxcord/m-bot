import type { MessageComponentInteraction } from "discord.js";
import { AttachmentBuilder, ChannelType, MessageFlags } from "discord.js";
import db from "../../database/db.ts";
import type { NewsDraftRow, SubmissionRow } from "../../database/types.ts";
import { SubmissionStatus } from "../submissionReview/types.ts";
import configuration from "../configuration/configuration.ts";
import { CommunityNewsChannelIdConfigurationKey } from "./config.ts";
import type { CommunityNewsSubmissionPayload } from "./types.ts";
import { LetterImageName } from "./types.ts";
import { getMessageLink, getThreadLink } from "../../shared/urlHelpers.ts";

export const serializeCommunityNewsSubmissionPayload = (newsDraftId: number) => {
    const payload: CommunityNewsSubmissionPayload = {
        NewsDraftId: newsDraftId
    };

    return JSON.stringify(payload);
}

const deserializeCommunityNewsSubmissionPayload = (payload: string) => {
    let parsed: CommunityNewsSubmissionPayload;
    try {
        parsed = JSON.parse(payload);
    }
    catch (e) {
        console.error(`Failed to parse community news submission payload: ${payload} with error: ${e}`);
        return null;
    }
    return parsed;
}

/**
 * Resolves the channel approved letters get posted to, or null when it isn't configured, isn't
 * visible, or is a kind of channel letters can't be posted to.
 */
export const getCommunityNewsChannel = (interaction: MessageComponentInteraction) => {
    if (!interaction.guildId)
        return null;

    const channelId = configuration.getConfigurationValue(interaction.guildId, CommunityNewsChannelIdConfigurationKey);
    if (!channelId)
        return null;

    const channel = interaction.guild?.channels.cache.get(channelId);
    if (!channel)
        return null;

    // Forum channels take a different posting call than text channels, so both kinds resolve here
    //   and are differentiated in postNews.
    if (channel.type === ChannelType.GuildForum)
        return channel;

    return channel.isTextBased() && channel.isSendable() ? channel : null;
}

export type CommunityNewsChannel = NonNullable<ReturnType<typeof getCommunityNewsChannel>>;

/** Discord caps thread names at 100 characters. */
const ForumPostNameMaxLength = 100;

/**
 * Posts a letter, creating a forum post or sending a message depending on the channel type.
 * Returns link to the forum post or message
 */
export const postNews = async (channel: CommunityNewsChannel, draft: NewsDraftRow) => {
    const file = new AttachmentBuilder(draft.Image, { name: LetterImageName });

    if (channel.type === ChannelType.GuildForum) {
        // Forum channels have no send(): every post is a thread, and the letter rides along as
        //   the starter message.
        const thread = await channel.threads.create({
            name: draft.Title.slice(0, ForumPostNameMaxLength),
            message: { files: [file] },
        });
        return getThreadLink(channel.guildId, thread.id);
    }

    const message = await channel.send({ files: [file] });
    return getMessageLink(channel.guildId, channel.id, message.id);
}

export const communityNewsSubmissionReviewHandler = async (submission: SubmissionRow, reviewInteraction: MessageComponentInteraction) => {
    if (submission.Status !== SubmissionStatus.Accepted)
        return;

    const payload = deserializeCommunityNewsSubmissionPayload(submission.Payload);
    if (!payload)
        return;

    // The stored image is the one the author approved, so a background reroll between submission
    //   and review can never change what actually gets posted.
    const draft = db.getNewsDraft(payload.NewsDraftId);
    if (!draft) {
        console.warn(`No news draft ${payload.NewsDraftId} found for submission ${submission.Id}`);
        await reviewInteraction.followUp({ content: "I couldn't find the draft for that submission, so nothing was posted.", flags: MessageFlags.Ephemeral });
        return;
    }

    const channel = getCommunityNewsChannel(reviewInteraction);
    if (!channel) {
        await reviewInteraction.followUp({
            content: "The community news channel isn't configured, so the approved letter wasn't posted.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    try {
        await postNews(channel, draft);
    }
    catch (e) {
        console.error(`Encountered error when attempting to post community news draft ${draft.Id}: ${e}`);
        await reviewInteraction.followUp({ content: "Something went wrong posting the letter.", flags: MessageFlags.Ephemeral });
    }
}
