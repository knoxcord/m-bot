import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { SubmissionReviewAction, SubmissionReviewCustomIdKey } from "./types.ts";

export const buildSubmitReviewButtonRow = (submissionId: number) =>
    new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setCustomId(`${SubmissionReviewCustomIdKey}:${SubmissionReviewAction.Accept}:${submissionId}`)
            .setLabel("✅ Approve")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`${SubmissionReviewCustomIdKey}:${SubmissionReviewAction.Reject}:${submissionId}`)
            .setLabel("🛑 Reject")
            .setStyle(ButtonStyle.Danger),
    );