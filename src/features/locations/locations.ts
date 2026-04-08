import db, { LocationRow, LocationImageRow } from "../../database/db.js";

class Locations {
    addLocation(guildId: string, name: string, addedByUserId: string, address?: string, description?: string, keywords?: string, hours?: string, url?: string) {
        return db.addLocation(guildId, name, addedByUserId, address, description, keywords, hours, url);
    }

    getLocation(guildId: string, name: string): LocationRow | undefined {
        return db.getLocation(guildId, name);
    }

    getAllLocations(guildId: string): LocationRow[] {
        return db.getAllLocations(guildId);
    }

    searchLocations(guildId: string, query: string): LocationRow[] {
        if (!query) return db.getAllLocations(guildId).slice(0, 25);
        return db.searchLocations(guildId, query);
    }

    updateLocation(guildId: string, currentName: string, name?: string, address?: string | null, description?: string | null, keywords?: string | null, hours?: string | null, url?: string | null) {
        return db.updateLocation(guildId, currentName, name, address, description, keywords, hours, url);
    }

    removeLocation(guildId: string, name: string) {
        return db.removeLocation(guildId, name);
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
