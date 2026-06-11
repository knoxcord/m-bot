import type { ModalMessageModalSubmitInteraction, ModalSubmitInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import type { IModal } from "./modalTypes.ts";
import { ModalCustomIdPrefix } from "./modalTypes.ts";
import locations from "../../features/locations/locations.ts";
import { LocationFieldId, LocationPanelAction } from "../../features/locations/types.ts";
import { buildImagePanel, buildLocationPanel, buildNotice } from "../../features/locations/builders.ts";
import { normalizeUrl } from "../../shared/urlHelpers.ts";

/** Reads a modal text input, returning null when blank so the field is cleared. */
const readField = (interaction: ModalSubmitInteraction, fieldId: LocationFieldId) => {
    const value = interaction.fields.getTextInputValue(fieldId).trim();
    return value || null;
};

const refreshPanel = async (interaction: ModalMessageModalSubmitInteraction, locationId: number) => {
    const updated = locations.getLocationById(locationId);
    if (!updated) {
        await interaction.update(buildNotice("This location no longer exists."));
        return;
    }
    await interaction.update(buildLocationPanel(updated, locations.getImages(updated.Id)));
};

const handleDetails = async (interaction: ModalMessageModalSubmitInteraction, locationId: number) => {
    const rawUrl = interaction.fields.getTextInputValue(LocationFieldId.Url).trim();
    const url = rawUrl ? normalizeUrl(rawUrl) : null;
    if (rawUrl && !url) {
        await interaction.reply({ content: `"${rawUrl}" isn't a valid website URL. Try something like https://example.com.`, flags: MessageFlags.Ephemeral });
        return;
    }

    locations.updateLocationById(
        locationId,
        undefined,
        readField(interaction, LocationFieldId.Address),
        readField(interaction, LocationFieldId.Description),
        readField(interaction, LocationFieldId.Keywords),
        readField(interaction, LocationFieldId.Hours),
        url,
    );
    await refreshPanel(interaction, locationId);
};

// Rename is separate because name is the only field that's really required and because
//   you can only have up to 5 inputs on a single modal
const handleRename = async (interaction: ModalMessageModalSubmitInteraction, locationId: number) => {
    const location = locations.getLocationById(locationId);
    if (!location) {
        await interaction.update(buildNotice("This location no longer exists."));
        return;
    }

    const newName = interaction.fields.getTextInputValue(LocationFieldId.Name).trim();
    if (!newName) {
        await interaction.reply({ content: "Name can't be empty.", flags: MessageFlags.Ephemeral });
        return;
    }

    if (newName !== location.Name) {
        const conflict = locations.getLocation(location.GuildId, newName);
        if (conflict) {
            await interaction.reply({ content: `A location named "${newName}" already exists in this server.`, flags: MessageFlags.Ephemeral });
            return;
        }
        locations.updateLocationById(locationId, newName);
    }

    await refreshPanel(interaction, locationId);
};

const handleAddImage = async (interaction: ModalMessageModalSubmitInteraction, locationId: number) => {
    const location = locations.getLocationById(locationId);
    if (!location) {
        await interaction.update(buildNotice("This location no longer exists."));
        return;
    }

    const rawUrl = interaction.fields.getTextInputValue(LocationFieldId.Image).trim();
    const url = normalizeUrl(rawUrl);
    if (!url) {
        await interaction.reply({ content: `"${rawUrl}" isn't a valid image URL. Try something like https://example.com/photo.jpg.`, flags: MessageFlags.Ephemeral });
        return;
    }

    locations.addImage(locationId, url, interaction.user.id);
    await interaction.update(buildImagePanel(location, locations.getImages(locationId)));
};

const handleLocationEditModalSubmit = async (interaction: ModalSubmitInteraction) => {
    if (!interaction.isFromMessage()) {
        await interaction.reply({ content: "Unexpected modal submission.", flags: MessageFlags.Ephemeral });
        return;
    }

    const [, action, locationIdRaw] = interaction.customId.split(":");
    const locationId = Number(locationIdRaw);

    if (!Number.isFinite(locationId)) {
        await interaction.reply({ content: "Invalid location id.", flags: MessageFlags.Ephemeral });
        return;
    }

    switch (action) {
        case LocationPanelAction.EditDetails:
            await handleDetails(interaction, locationId);
            break;
        case LocationPanelAction.Rename:
            await handleRename(interaction, locationId);
            break;
        case LocationPanelAction.AddImage:
            await handleAddImage(interaction, locationId);
            break;
        default:
            await interaction.reply({ content: "Unknown action.", flags: MessageFlags.Ephemeral });
    }
};

export const LocationEdit: IModal = {
    customIdPrefix: ModalCustomIdPrefix.LocationEdit,
    handler: handleLocationEditModalSubmit,
};
