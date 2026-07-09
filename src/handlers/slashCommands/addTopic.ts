import type { ChatInputCommandInteraction } from "discord.js";
import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import type { ISlashCommand } from "./commandTypes.ts";
import { CommandKey } from "./commandTypes.ts";
import { buildTopicAddModal } from "../../features/topic/builders.ts";

const Key = CommandKey.AddTopic;

const builder = new SlashCommandBuilder()
    .setName(Key)
    .setDescription("Add a new topic via a modal")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);

const addTopicHandler = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId || !interaction.guild)
        return;

    // No need to restrict channels where topics can be added because there is only an ephemeral reply.
    // No need to restrict roles that can add topic because the default slash command access requires ManageGuild
    //   and this can be customized as needed per-guild.

    await interaction.showModal(buildTopicAddModal());
};

export const AddTopic: ISlashCommand = {
    builder: builder,
    handler: addTopicHandler,
    key: Key,
};
