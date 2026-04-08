import { AutocompleteInteraction, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { CommandKey, ISlashCommand } from "./commandTypes.js";
import locations from "../../features/locations/locations.js";

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
        await interaction.reply({ content: `Location "${name}" not found.`, ephemeral: true });
        return;
    }

    const images = locations.getImages(location.Id);

    // In order to have multiple images show as the same embed, you have to set all the embeds to the
    //   same url. So we'll use the location url if available, else we'll use the first image. If there
    //   are no images then it doesnt matter because we wont have the additional embeds.
    const embedUrl = location.Url ?? images?.[0]?.ImageUrl;

    const embed = new EmbedBuilder()
        .setTitle(location.Name)
        .setColor(0x2B82D1)
        .setURL(embedUrl);

    if (location.Description) embed.setDescription(location.Description);
    if (location.Address) embed.addFields({ name: "Address", value: location.Address, inline: true });
    if (location.Hours) embed.addFields({ name: "Hours", value: location.Hours, inline: true });
    if (location.Url) embed.addFields({ name: "Website", value: location.Url });
    if (location.Keywords) embed.addFields({ name: "Keywords", value: location.Keywords });
    if (images.length > 0) embed.setImage(images[0].ImageUrl);

    embed.setTimestamp(new Date(location.CreatedAt));

    const embeds = [embed];
    for (const img of images.slice(1, 9)) {
        embeds.push(new EmbedBuilder()
            .setImage(img.ImageUrl)
            .setColor(0x2B82D1)
            .setURL(embedUrl));
    }

    await interaction.reply({ embeds });
};

const locationInfoAutocompleteHandler = async (interaction: AutocompleteInteraction) => {
    const focusedValue = interaction.options.getFocused();
    const guildId = interaction.guildId ?? "";
    const results = locations.searchLocations(guildId, focusedValue);

    await interaction.respond(
        results.map(location => ({
            name: location.Name,
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
