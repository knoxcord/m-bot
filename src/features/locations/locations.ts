import type { LocationRow, LocationImageRow } from "../../database/types.ts";
import db from "../../database/db.ts";
import { AutocompleteResultLimit } from "../../shared/autocompleteOptionFormatter.ts";

class Locations {
    addLocation(guildId: string, name: string, addedByUserId: string, address?: string, description?: string, keywords?: string, hours?: string, url?: string) {
        return db.addLocation(guildId, name, addedByUserId, address, description, keywords, hours, url);
    }

    getLocation(guildId: string, name: string): LocationRow | undefined {
        return db.getLocation(guildId, name);
    }

    getLocationById(id: number): LocationRow | undefined {
        return db.getLocationById(id);
    }

    getAllLocations(guildId: string): LocationRow[] {
        return db.getAllLocations(guildId);
    }

    searchLocations(guildId: string, query: string): LocationRow[] {
        if (!query) return db.getAllLocations(guildId).slice(0, AutocompleteResultLimit);
        return db.searchLocations(guildId, query);
    }

    updateLocation(guildId: string, currentName: string, name?: string, address?: string | null, description?: string | null, keywords?: string | null, hours?: string | null, url?: string | null) {
        return db.updateLocation(guildId, currentName, name, address, description, keywords, hours, url);
    }

    updateLocationById(id: number, name?: string, address?: string | null, description?: string | null, keywords?: string | null, hours?: string | null, url?: string | null) {
        return db.updateLocationById(id, name, address, description, keywords, hours, url);
    }

    removeLocation(guildId: string, name: string) {
        return db.removeLocation(guildId, name);
    }

    removeLocationById(id: number) {
        return db.removeLocationById(id);
    }

    addImage(locationId: number, imageUrl: string, addedByUserId: string) {
        return db.addLocationImage(locationId, imageUrl, addedByUserId);
    }

    getImages(locationId: number): LocationImageRow[] {
        return db.getLocationImages(locationId);
    }

    removeImage(imageId: number) {
        return db.removeLocationImage(imageId);
    }
}

export default new Locations();
