import type { ChatInputCommandInteraction } from "discord.js";
import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import type { ISlashCommand } from "./commandTypes.ts";
import { CommandKey } from "./commandTypes.ts";
import config from "../../config.ts";
import { buildNewsAddModal } from "../../features/communityNews/builders.ts";

const Key = CommandKey.AddNews;

const builder = new SlashCommandBuilder()
    .setName(Key)
    .setDescription("Opens a modal where you can add community news")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);

const addNewsHandler = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId || !interaction.guild)
        return;

    // No need to restrict channels where topics can be added because there is only an ephemeral reply.
    // No need to restrict roles that can add topic because the default slash command access requires ManageGuild
    //   and this can be customized as needed per-guild.

    await interaction.showModal(buildNewsAddModal());
};

const command: ISlashCommand = {
    builder: builder,
    handler: addNewsHandler,
    key: Key,
};

// Dont bother registering the command if the letter generator isnt configured
export const AddNews = config.letterGeneratorUrl ? command : undefined;
