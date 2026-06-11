import type { AutocompleteInteraction, ChatInputCommandInteraction} from "discord.js";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ISlashCommand } from "./commandTypes.ts";
import { CommandKey } from "./commandTypes.ts";
import locations from "../../features/locations/locations.ts";
import { buildLocationContainer } from "../../features/locations/builders.ts";
import { formatAutocompleteName } from "../../shared/autocompleteOptionFormatter.ts";

const Key = CommandKey.LocationInfo;

const builder = new SlashCommandBuilder()
    .setName(Key)
    .setDescription("Get info about a location")
    .addStringOption(option =>
        option.setName("name")
            .setDescription("The location to look up (search by name, keywords, address, etc.)")
            .setRequired(true)
            .setAutocomplete(true));

const locationInfoHandler = async (interaction: ChatInputCommandInteraction) => {
    const name = interaction.options.getString("name", true);
    const guildId = interaction.guildId ?? "";
    const location = locations.getLocation(guildId, name);

    if (!location) {
        await interaction.reply({ content: `Location "${name}" not found.`, flags: MessageFlags.Ephemeral });
        return;
    }

    const images = locations.getImages(location.Id);
    const container = buildLocationContainer(location, images);

    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
};

const locationInfoAutocompleteHandler = async (interaction: AutocompleteInteraction) => {
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

export const LocationInfo: ISlashCommand = {
    builder,
    handler: locationInfoHandler,
    autocompleteHandler: locationInfoAutocompleteHandler,
    key: Key,
};
