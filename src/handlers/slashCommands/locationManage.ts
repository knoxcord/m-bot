import type { AutocompleteInteraction, ChatInputCommandInteraction} from "discord.js";
import { MessageFlags, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import type { ISlashCommand } from "./commandTypes.ts";
import { CommandKey } from "./commandTypes.ts";
import locations from "../../features/locations/locations.ts";
import { buildLocationPanel } from "../../features/locations/builders.ts";
import { formatAutocompleteName } from "../../shared/autocompleteOptionFormatter.ts";

const Key = CommandKey.LocationManage;

enum LocationManageSubcommand {
    Add = "add",
    Edit = "edit",
    Remove = "remove",
}

const LocationOptionName = "name";

const builder = new SlashCommandBuilder()
    .setName(Key)
    .setDescription("Manage locations")
    .addSubcommand(subcommand =>
        subcommand
            .setName(LocationManageSubcommand.Add)
            .setDescription("Add a new location")
            .addStringOption(option =>
                option.setName("name")
                    .setDescription("Name of the location")
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName(LocationManageSubcommand.Edit)
            .setDescription("Edit an existing location")
            .addStringOption(option =>
                option.setName(LocationOptionName)
                    .setDescription("The location to edit")
                    .setRequired(true)
                    .setAutocomplete(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName(LocationManageSubcommand.Remove)
            .setDescription("Remove a location")
            .addStringOption(option =>
                option.setName(LocationOptionName)
                    .setDescription("The location to remove")
                    .setRequired(true)
                    .setAutocomplete(true)))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);

const handleAdd = async (interaction: ChatInputCommandInteraction) => {
    const guildId = interaction.guildId ?? "";
    const name = interaction.options.getString("name", true);

    const existing = locations.getLocation(guildId, name);
    if (existing) {
        await interaction.reply({ content: `A location named "${name}" already exists in this server.`, flags: MessageFlags.Ephemeral });
        return;
    }

    const result = locations.addLocation(guildId, name, interaction.user.id);
    const location = locations.getLocationById(Number(result.lastInsertRowid));
    if (!location) {
        await interaction.reply({ content: "Failed to create the location.", flags: MessageFlags.Ephemeral });
        return;
    }

    await interaction.reply({ ...buildLocationPanel(location, locations.getImages(location.Id)), flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
};

const handleEdit = async (interaction: ChatInputCommandInteraction) => {
    const guildId = interaction.guildId ?? "";
    const name = interaction.options.getString(LocationOptionName, true);

    const location = locations.getLocation(guildId, name);
    if (!location) {
        await interaction.reply({ content: `Location "${name}" not found.`, flags: MessageFlags.Ephemeral });
        return;
    }

    await interaction.reply({ ...buildLocationPanel(location, locations.getImages(location.Id)), flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
};

const handleRemove = async (interaction: ChatInputCommandInteraction) => {
    const guildId = interaction.guildId ?? "";
    const name = interaction.options.getString(LocationOptionName, true);

    const existing = locations.getLocation(guildId, name);
    if (!existing) {
        await interaction.reply({ content: `Location "${name}" not found.`, flags: MessageFlags.Ephemeral });
        return;
    }

    locations.removeLocation(guildId, name);
    await interaction.reply(`Removed location **${name}**.`);
};

const locationManageHandler = async (interaction: ChatInputCommandInteraction) => {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case LocationManageSubcommand.Add:
            await handleAdd(interaction);
            break;
        case LocationManageSubcommand.Edit:
            await handleEdit(interaction);
            break;
        case LocationManageSubcommand.Remove:
            await handleRemove(interaction);
            break;
    }
};

const locationManageAutocompleteHandler = async (interaction: AutocompleteInteraction) => {
    const focusedValue = interaction.options.getFocused();
    const guildId = interaction.guildId ?? "";
    const results = locations.searchLocations(guildId, focusedValue);

    await interaction.respond(
        results.map(location => ({
            name: formatAutocompleteName(location.Name),
            value: location.Name,
        }))
    );
};

export const LocationManage: ISlashCommand = {
    builder,
    handler: locationManageHandler,
    autocompleteHandler: locationManageAutocompleteHandler,
    key: Key,
};
