import type { AutocompleteInteraction, ChatInputCommandInteraction} from "discord.js";
import { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import type { ISlashCommand } from "./commandTypes.ts";
import { CommandKey } from "./commandTypes.ts";
import locations from "../../features/locations/locations.ts";
import { formatAutocompleteName } from "../../shared/autocompleteOptionFormatter.ts";

const Key = CommandKey.LocationManage;

enum LocationManageSubcommand {
    Add = "add",
    Edit = "edit",
    Remove = "remove",
    AddImage = "add-image",
    GetImages = "get-images",
    RemoveImage = "remove-image",
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
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("address")
                    .setDescription("Address of the location")
                    .setRequired(false))
            .addStringOption(option =>
                option.setName("description")
                    .setDescription("Description of the location")
                    .setRequired(false))
            .addStringOption(option =>
                option.setName("keywords")
                    .setDescription("Search keywords (comma-separated, e.g. \"hiking,dogs,trails\")")
                    .setRequired(false))
            .addStringOption(option =>
                option.setName("hours")
                    .setDescription("Operating hours")
                    .setRequired(false))
            .addStringOption(option =>
                option.setName("url")
                    .setDescription("Website URL")
                    .setRequired(false))
            .addStringOption(option =>
                option.setName("image")
                    .setDescription("First image URL for the location (add more with add-image subcommand)")
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand
            .setName(LocationManageSubcommand.Edit)
            .setDescription("Edit an existing location")
            .addStringOption(option =>
                option.setName(LocationOptionName)
                    .setDescription("The location to edit")
                    .setRequired(true)
                    .setAutocomplete(true))
            .addStringOption(option =>
                option.setName("new-name")
                    .setDescription("New name for the location")
                    .setRequired(false))
            .addStringOption(option =>
                option.setName("address")
                    .setDescription("New address")
                    .setRequired(false))
            .addStringOption(option =>
                option.setName("description")
                    .setDescription("New description")
                    .setRequired(false))
            .addStringOption(option =>
                option.setName("keywords")
                    .setDescription("New keywords (comma-separated)")
                    .setRequired(false))
            .addStringOption(option =>
                option.setName("hours")
                    .setDescription("New operating hours")
                    .setRequired(false))
            .addStringOption(option =>
                option.setName("url")
                    .setDescription("New website URL")
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand
            .setName(LocationManageSubcommand.Remove)
            .setDescription("Remove a location")
            .addStringOption(option =>
                option.setName(LocationOptionName)
                    .setDescription("The location to remove")
                    .setRequired(true)
                    .setAutocomplete(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName(LocationManageSubcommand.AddImage)
            .setDescription("Add an image to an existing location")
            .addStringOption(option =>
                option.setName(LocationOptionName)
                    .setDescription("The location to add an image to")
                    .setRequired(true)
                    .setAutocomplete(true))
            .addStringOption(option =>
                option.setName("image")
                    .setDescription("Image URL")
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName(LocationManageSubcommand.GetImages)
            .setDescription("View images for a location with their IDs")
            .addStringOption(option =>
                option.setName(LocationOptionName)
                    .setDescription("The location to view images for")
                    .setRequired(true)
                    .setAutocomplete(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName(LocationManageSubcommand.RemoveImage)
            .setDescription("Remove an image from a location by ID")
            .addIntegerOption(option =>
                option.setName("image-id")
                    .setDescription("The image ID (use get-images to find IDs)")
                    .setRequired(true)))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);

const handleAdd = async (interaction: ChatInputCommandInteraction) => {
    const guildId = interaction.guildId ?? "";
    const name = interaction.options.getString("name", true);
    const address = interaction.options.getString("address") ?? undefined;
    const description = interaction.options.getString("description") ?? undefined;
    const keywords = interaction.options.getString("keywords") ?? undefined;
    const hours = interaction.options.getString("hours") ?? undefined;
    const url = interaction.options.getString("url") ?? undefined;
    const image = interaction.options.getString("image") ?? undefined;

    const existing = locations.getLocation(guildId, name);
    if (existing) {
        await interaction.reply({ content: `A location named "${name}" already exists in this server.`, ephemeral: true });
        return;
    }

    const result = locations.addLocation(guildId, name, interaction.user.id, address, description, keywords, hours, url);

    if (image) {
        const locationId = Number(result.lastInsertRowid);
        locations.addImage(locationId, image, interaction.user.id);
    }

    await interaction.reply(`Added location **${name}**!`);
};

const handleEdit = async (interaction: ChatInputCommandInteraction) => {
    const guildId = interaction.guildId ?? "";
    const name = interaction.options.getString(LocationOptionName, true);
    const newName = interaction.options.getString("new-name") ?? undefined;
    const address = interaction.options.getString("address") ?? undefined;
    const description = interaction.options.getString("description") ?? undefined;
    const keywords = interaction.options.getString("keywords") ?? undefined;
    const hours = interaction.options.getString("hours") ?? undefined;
    const url = interaction.options.getString("url") ?? undefined;

    const existing = locations.getLocation(guildId, name);
    if (!existing) {
        await interaction.reply({ content: `Location "${name}" not found.`, ephemeral: true });
        return;
    }

    if (!newName && !address && !description && !keywords && !hours && !url) {
        await interaction.reply({ content: "No changes provided. Specify at least one field to update.", ephemeral: true });
        return;
    }

    if (newName && newName !== name) {
        const conflict = locations.getLocation(guildId, newName);
        if (conflict) {
            await interaction.reply({ content: `A location named "${newName}" already exists in this server.`, ephemeral: true });
            return;
        }
    }

    locations.updateLocation(guildId, name, newName, address, description, keywords, hours, url);
    const displayName = newName ?? name;
    await interaction.reply(`Updated location **${displayName}**.`);
};

const handleRemove = async (interaction: ChatInputCommandInteraction) => {
    const guildId = interaction.guildId ?? "";
    const name = interaction.options.getString(LocationOptionName, true);

    const existing = locations.getLocation(guildId, name);
    if (!existing) {
        await interaction.reply({ content: `Location "${name}" not found.`, ephemeral: true });
        return;
    }

    locations.removeLocation(guildId, name);
    await interaction.reply(`Removed location **${name}**.`);
};

const handleAddImage = async (interaction: ChatInputCommandInteraction) => {
    const guildId = interaction.guildId ?? "";
    const name = interaction.options.getString(LocationOptionName, true);
    const image = interaction.options.getString("image", true);

    const location = locations.getLocation(guildId, name);
    if (!location) {
        await interaction.reply({ content: `Location "${name}" not found.`, ephemeral: true });
        return;
    }

    locations.addImage(location.Id, image, interaction.user.id);
    await interaction.reply(`Added image to **${name}**.`);
};

const handleGetImages = async (interaction: ChatInputCommandInteraction) => {
    const guildId = interaction.guildId ?? "";
    const name = interaction.options.getString(LocationOptionName, true);

    const location = locations.getLocation(guildId, name);
    if (!location) {
        await interaction.reply({ content: `Location "${name}" not found.`, ephemeral: true });
        return;
    }

    const images = locations.getImages(location.Id);
    if (images.length === 0) {
        await interaction.reply({ content: `**${name}** has no images.`, ephemeral: true });
        return;
    }

    const embeds = images.map((img, index) =>
        new EmbedBuilder()
            .setTitle(`Image ${index + 1} (ID: ${img.Id})`)
            .setImage(img.ImageUrl)
            .setColor(0x2B82D1)
    );

    await interaction.reply({ content: `Images for **${name}**:`, embeds, ephemeral: true });
};

const handleRemoveImage = async (interaction: ChatInputCommandInteraction) => {
    const imageId = interaction.options.getInteger("image-id", true);
    const result = locations.removeImage(imageId);

    if (result.changes === 0) {
        await interaction.reply({ content: `Image with ID ${imageId} not found.`, ephemeral: true });
        return;
    }

    await interaction.reply(`Removed image ID ${imageId}.`);
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
        case LocationManageSubcommand.AddImage:
            await handleAddImage(interaction);
            break;
        case LocationManageSubcommand.GetImages:
            await handleGetImages(interaction);
            break;
        case LocationManageSubcommand.RemoveImage:
            await handleRemoveImage(interaction);
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
