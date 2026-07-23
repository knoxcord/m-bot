import type { GuildMember, MessageComponentInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import type { IMessageComponent } from "./messageComponentTypes.ts";
import { MessageComponentCustomIdPrefix } from "./messageComponentTypes.ts";
import configuration from "../../features/configuration/configuration.ts";
import { ModeratorRoleIdsConfigurationKey } from "../../features/configuration/shared.ts";
import { reviewSubmission } from "../../features/submissionReview/submission.ts";
import { SubmissionReviewAction } from "../../features/submissionReview/types.ts";
import { isEnumValue } from "../../shared/enumHelpers.ts";

const handler = async (interaction: MessageComponentInteraction) => {
    if (!interaction.guildId || !interaction.guild)
        return;

    const [, action, submissionIdRaw] = interaction.customId.split(":");

    if (!isEnumValue(action, SubmissionReviewAction)) {
        console.warn(`Unable to parse submission review action: ${action}`);
        return;
    }

    const submissionId = Number(submissionIdRaw);
    if (!Number.isFinite(submissionId)) {
        console.warn(`Invalid submission id: ${submissionIdRaw}`);
        return;
    }

    const moderatorRoleIds = configuration.getConfigurationValue(interaction.guildId, ModeratorRoleIdsConfigurationKey)?.split(',') ?? [];
    if (moderatorRoleIds.length < 1) {
        console.warn(`Found empty moderatorRoleIds config for guildId ${interaction.guildId}`);
    }

    const reviewingUserId = interaction.user.id;
    let reviewingUser: GuildMember;
    try {
        reviewingUser = await interaction.guild.members.fetch(reviewingUserId);
    } catch (error) {
        console.warn(`Failed to fetch user for id: ${reviewingUserId} with error ${error}`);
        return;
    }

    const userCanReview = reviewingUser.roles.cache.hasAny(...moderatorRoleIds);
    if (!userCanReview) {
        await interaction.reply({ content: "You don't have permission to review submissions.", flags: MessageFlags.Ephemeral });
        return;
    }

    await reviewSubmission(interaction, submissionId, action);
};

export const SubmissionReviewComponent: IMessageComponent = {
    customIdPrefix: MessageComponentCustomIdPrefix.SubmissionReview,
    handler,
};
