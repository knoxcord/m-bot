import { MessageComponentInteraction, MessageFlags } from "discord.js";
import { IMessageComponent, MessageComponentCustomIdPrefix } from "./messageComponentTypes.js";
import db from "../../database/db.js";
import { assignRole, sendWelcomeMessage } from "../../features/autoRole/autoRole.js";
import config from "../../config.json" with { type: "json" }

const handleExisingSubmission = async (interaction: MessageComponentInteraction, existingSubmissionScore: number) => {
    if (!interaction.guildId || !interaction.guild)
        return;
    
    console.info(`Reassigning preset role to userid: ${interaction.user.id} in guildId: ${interaction.guildId}`);
    const authorUser = await interaction.guild?.members.fetch(interaction.user.id);
    const newRole = await assignRole(authorUser, existingSubmissionScore)
    await authorUser.roles.remove(config.presetRoleId);
    await sendWelcomeMessage(authorUser, newRole, interaction.guild);
    await interaction.reply({ content: `Excellent. You may now close this channel`, flags: MessageFlags.Ephemeral });
}

const handler = async (interaction: MessageComponentInteraction) => {
    if (!interaction.guildId || !interaction.guild)
        return;

    const exisingSubmission = db.getScoreSubmissionForUser(interaction.guildId, interaction.user.id);
    if (exisingSubmission)
        return handleExisingSubmission(interaction, exisingSubmission.Score);

    // If somehow the preset score cant be found
    
    // Remove any already assigned roles
    const targetUser = await interaction.guild.members.fetch(interaction.user.id);
    await Promise.all(
        [config.monkRoleId, config.normieRoleId, config.performerRoleId, config.presetRoleId]
            .filter(roleId => targetUser.roles.cache.has(roleId))
            .map(roleId => targetUser.roles.remove(roleId))
    );

    // Ensure user has Unsorted role
    if (!targetUser.roles.cache.has(config.unsortedRoleId))
        await targetUser.roles.add(config.unsortedRoleId);
    
    interaction.reply("Hmm... Something went wrong. Head over to #start-here instead");
};

export const PresetRole: IMessageComponent = {
    customIdPrefix: MessageComponentCustomIdPrefix.PresetRole,
    handler: handler
};
