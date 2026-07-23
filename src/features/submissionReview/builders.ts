import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { SubmissionReviewAction, SubmissionReviewCustomIdKey } from "./types.ts";

export const buildSubmitReviewButtonRow = (submissionId: number, disabled = false) =>
    new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setCustomId(`${SubmissionReviewCustomIdKey}:${SubmissionReviewAction.Accept}:${submissionId}`)
            .setLabel("✅ Approve")
            .setStyle(ButtonStyle.Success)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId(`${SubmissionReviewCustomIdKey}:${SubmissionReviewAction.Reject}:${submissionId}`)
            .setLabel("🛑 Reject")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled),
    );