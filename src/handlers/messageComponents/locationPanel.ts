import type { MessageComponentInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import type { IMessageComponent } from "./messageComponentTypes.ts";
import { MessageComponentCustomIdPrefix } from "./messageComponentTypes.ts";
import locations from "../../features/locations/locations.ts";
import { LocationPanelAction } from "../../features/locations/types.ts";
import { buildAddImageModal, buildDeleteConfirmation, buildImageCarousel, buildImagePanel, buildLocationDetailsModal, buildLocationPanel, buildLocationRenameModal, buildNotice, buildHelpMessage } from "../../features/locations/builders.ts";

const handler = async (interaction: MessageComponentInteraction) => {
    const [, action, locationIdRaw, imageIdRaw] = interaction.customId.split(":");
    const locationId = Number(locationIdRaw);

    if (!Number.isFinite(locationId)) {
        console.warn(`Invalid location panel id: ${locationIdRaw}`);
        return;
    }

    const location = locations.getLocationById(locationId);
    if (!location) {
        await interaction.update(buildNotice("This location no longer exists."));
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
            await interaction.update(buildDeleteConfirmation(location));
            break;
        case LocationPanelAction.ConfirmDelete:
            locations.removeLocationById(locationId);
            await interaction.update(buildNotice(`🗑️ Deleted **${location.Name}**.`));
            break;
        case LocationPanelAction.CancelDelete:
            await interaction.update(buildLocationPanel(location, locations.getImages(locationId)));
            break;
        case LocationPanelAction.Refresh:
            await interaction.update(buildLocationPanel(location, locations.getImages(locationId)));
            break;
        case LocationPanelAction.Done:
            await interaction.update(buildLocationPanel(location, locations.getImages(locationId), true));
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
        case LocationPanelAction.Help:
            await interaction.reply(buildHelpMessage());
            break;
        default:
            console.warn(`Unknown location panel action: ${action}`);
            await interaction.reply({ content: "Unknown action.", flags: MessageFlags.Ephemeral });
    }
};

export const LocationPanelComponent: IMessageComponent = {
    customIdPrefix: MessageComponentCustomIdPrefix.LocationPanel,
    handler,
};
