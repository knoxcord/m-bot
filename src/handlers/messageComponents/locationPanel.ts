import type { MessageComponentInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import type { IMessageComponent } from "./messageComponentTypes.ts";
import { MessageComponentCustomIdPrefix } from "./messageComponentTypes.ts";
import locations from "../../features/locations/locations.ts";
import { LocationPanelAction } from "../../features/locations/types.ts";
import { buildAddImageModal, buildImageCarousel, buildImagePanel, buildLocationDetailsModal, buildLocationPanel, buildLocationRenameModal } from "../../features/locations/builders.ts";

const handler = async (interaction: MessageComponentInteraction) => {
    const [, action, locationIdRaw, imageIdRaw] = interaction.customId.split(":");
    const locationId = Number(locationIdRaw);

    if (!Number.isFinite(locationId)) {
        console.warn(`Invalid location panel id: ${locationIdRaw}`);
        return;
    }

    const location = locations.getLocationById(locationId);
    if (!location) {
        await interaction.update({ content: "This location no longer exists.", embeds: [], components: [] });
        return;
    }

    switch (action) {
        case LocationPanelAction.EditDetails:
            await interaction.showModal(buildLocationDetailsModal(location));
            break;
        case LocationPanelAction.Rename:
            await interaction.showModal(buildLocationRenameModal(location));
            break;
        case LocationPanelAction.Delete:
            locations.removeLocationById(locationId);
            await interaction.update({ content: `🗑️ Deleted **${location.Name}**.`, embeds: [], components: [] });
            break;
        case LocationPanelAction.Done:
            await interaction.update({ content: `✅ Saved **${location.Name}**.`, ...buildLocationPanel(location, true), components: [] });
            break;
        case LocationPanelAction.ManageImages:
            await interaction.reply({ ...buildImagePanel(location, locations.getImages(locationId)), flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
            break;
        case LocationPanelAction.AddImage:
            await interaction.showModal(buildAddImageModal(locationId));
            break;
        case LocationPanelAction.DeleteImage:
            locations.removeImage(Number(imageIdRaw));
            await interaction.update(buildImagePanel(location, locations.getImages(locationId)));
            break;
        case LocationPanelAction.DoneImages:
            await interaction.update(buildImageCarousel(location, locations.getImages(locationId)));
            break;
        default:
            console.warn(`Unknown location panel action: ${action}`);
            await interaction.reply({ content: "Unknown action.", flags: MessageFlags.Ephemeral });
    }
};

export const LocationPanel: IMessageComponent = {
    customIdPrefix: MessageComponentCustomIdPrefix.LocationPanel,
    handler,
};
