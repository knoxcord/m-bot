import type { ForumChannel, ForumThreadChannel, GuildForumTag, MessageComponentInteraction } from "discord.js";
import { AttachmentBuilder, ChannelType, MessageFlags, PermissionsBitField } from "discord.js";
import db from "../../database/db.ts";
import type { NewsDraftRow, SubmissionRow } from "../../database/types.ts";
import { SubmissionStatus } from "../submissionReview/types.ts";
import type { CommunityNewsChannel } from "./channel.ts";
import { getCommunityNewsChannel, isLockingTag } from "./channel.ts";
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

/** Discord caps thread names at 100 characters. */
const ForumPostNameMaxLength = 100;

/** Checked when a lock fails, since a channel overwrite withholding one of these is the usual cause. */
const LockRelatedPermissions = [
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.ManageThreads,
    PermissionsBitField.Flags.SendMessagesInThreads,
];

/**
 * Locks a post filed under a locking tag. A failure is logged rather than thrown, since the letter
 * is already up and shouldn't read to the author as a failed post. Whichever permissions the forum
 * withholds go into the log, because Discord answers with a bare Missing Access either way.
 */
const lockPost = async (channel: ForumChannel, thread: ForumThreadChannel, tag: GuildForumTag) => {
    try {
        await thread.setLocked(true);
    }
    catch (e) {
        const me = channel.guild.members.me;
        const missing = me ? channel.permissionsFor(me).missing(LockRelatedPermissions) : ["unresolved"];
        console.error(`Failed to lock post ${thread.id} tagged ${tag.name} in #${channel.name} `
            + `for guildId ${channel.guildId}. `
            + `Missing: ${missing.join(", ") || "nothing relevant"}. Error: ${e}`);
    }
};

/**
 * Posts a letter, creating a forum post or sending a message depending on the channel type.
 * Returns link to the forum post or message
 */
export const postNews = async (channel: CommunityNewsChannel, draft: NewsDraftRow) => {
    const file = new AttachmentBuilder(draft.Image, { name: LetterImageName });

    if (channel.type === ChannelType.GuildForum) {
        const tag = channel.availableTags.find(availableTag => availableTag.id === draft.TagId);

        // Forum channels have no send(): every post is a thread, and the letter rides along as
        //   the starter message.
        const thread = await channel.threads.create({
            name: draft.Title.slice(0, ForumPostNameMaxLength),
            message: { files: [file] },
            appliedTags: tag ? [tag.id] : [],
        });

        if (tag && isLockingTag(channel.guildId, tag))
            await lockPost(channel, thread, tag);

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
