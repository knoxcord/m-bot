import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, LabelBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags, ModalBuilder, TextDisplayBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import type { LocationImageRow, LocationRow } from "../../database/db.ts";
import { LocationFieldId, LocationPanelAction, LocationPanelCustomIdKey } from "./types.ts";
import { ModalCustomIdPrefix } from "../../handlers/modals/modalTypes.ts";
import { normalizeUrl } from "../../shared/urlHelpers.ts";

const EmptyValue = "—";
const PanelColor = 0x2B82D1;
/** Discord caps a message at 10 embeds and 5 action rows; keep image management within both. */
const MaxManagedImages = 10;

const displayValue = (value: string | null) => (value && value.trim() ? value : EmptyValue);

const panelButton = (action: LocationPanelAction, locationId: number) =>
    new ButtonBuilder().setCustomId(`${LocationPanelCustomIdKey}:${action}:${locationId}`);

export const buildLocationPanel = (location: LocationRow, isComplete: boolean = false) => {
    const embed = new EmbedBuilder()
        .setTitle(`📍 ${location.Name}`)
        .setColor(PanelColor)
        .addFields(
            { name: "Address", value: displayValue(location.Address) },
            { name: "Description", value: displayValue(location.Description) },
            { name: "Keywords", value: displayValue(location.Keywords), inline: true },
            { name: "Hours", value: displayValue(location.Hours), inline: true },
            { name: "URL", value: displayValue(location.Url) },
        )
        .setFooter(isComplete ? null : { text: "Changes save automatically. Press Done when finished." });

    const buttons = new ActionRowBuilder<ButtonBuilder>().setComponents(
        panelButton(LocationPanelAction.EditDetails, location.Id).setLabel("Edit details").setStyle(ButtonStyle.Primary),
        panelButton(LocationPanelAction.Rename, location.Id).setLabel("Rename").setStyle(ButtonStyle.Secondary),
        panelButton(LocationPanelAction.ManageImages, location.Id).setLabel("Manage images").setStyle(ButtonStyle.Secondary),
        panelButton(LocationPanelAction.Delete, location.Id).setLabel("Delete Location").setStyle(ButtonStyle.Danger),
        panelButton(LocationPanelAction.Done, location.Id).setLabel("Done").setStyle(ButtonStyle.Success),
    );

    return { embeds: [embed], components: isComplete ? [] :[buttons] };
};

// A Components V2 message renders its top-level components top-to-bottom, which lets us place each
// image's delete button directly beneath the image (classic embeds + action rows can't interleave).
export const buildImagePanel = (location: LocationRow, images: LocationImageRow[]) => {
    const managed = images.slice(0, MaxManagedImages);

    const header = managed.length === 0
        ? `**${location.Name}** has no images yet.`
        : images.length > MaxManagedImages
            ? `Showing the first ${MaxManagedImages} of ${images.length} images for **${location.Name}**:`
            : `Images for **${location.Name}**:`;

    const components: (TextDisplayBuilder | MediaGalleryBuilder | ActionRowBuilder<ButtonBuilder>)[] = [
        new TextDisplayBuilder().setContent(header),
    ];

    managed.forEach((image, index) => {
        const normalized = normalizeUrl(image.ImageUrl);
        // setURL throws on malformed URLs; show the raw value instead so a bad image can still be deleted.
        if (normalized) {
            components.push(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(normalized)));
            components.push(new TextDisplayBuilder().setContent(image.ImageUrl));
        } else {
            components.push(new TextDisplayBuilder().setContent(`⚠️ Image ${index + 1} has an invalid URL: ${image.ImageUrl}`));
        }
        components.push(new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setCustomId(`${LocationPanelCustomIdKey}:${LocationPanelAction.DeleteImage}:${location.Id}:${image.Id}`)
                .setLabel(`🗑️ Delete image ${index + 1}`)
                .setStyle(ButtonStyle.Danger),
        ));
    });

    components.push(new ActionRowBuilder<ButtonBuilder>().setComponents(
        panelButton(LocationPanelAction.AddImage, location.Id).setLabel("Add image").setStyle(ButtonStyle.Success),
        panelButton(LocationPanelAction.DoneImages, location.Id).setLabel("Done").setStyle(ButtonStyle.Primary),
    ));
    components.push(new TextDisplayBuilder().setContent("-# Changes save automatically. Press Done when finished."));

    return { components, flags: MessageFlags.IsComponentsV2 as const };
};

// On "Done" we collapse the per-image edit rows into a single gallery so the images read as one carousel
// (the location-info look) rather than individual lines. A single MediaGallery with multiple items groups
// natively in Components V2 — the classic matching-embedUrl trick only applies to non-V2 embeds, which this
// message can't switch to once it carries the IsComponentsV2 flag.
export const buildImageCarousel = (location: LocationRow, images: LocationImageRow[]) => {
    const managed = images.slice(0, MaxManagedImages);
    const gallery = new MediaGalleryBuilder();
    let shown = 0;

    managed.forEach(image => {
        const normalized = normalizeUrl(image.ImageUrl);
        if (normalized) {
            gallery.addItems(new MediaGalleryItemBuilder().setURL(normalized));
            shown++;
        }
    });

    const header = shown === 0
        ? `**${location.Name}** has no images.`
        : `Images for **${location.Name}**:`;

    const components: (TextDisplayBuilder | MediaGalleryBuilder)[] = [
        new TextDisplayBuilder().setContent(header),
    ];
    if (shown > 0) components.push(gallery);

    return { components, flags: MessageFlags.IsComponentsV2 as const };
};

const textInputLabel = (
    fieldId: LocationFieldId,
    label: string,
    style: TextInputStyle,
    value: string | null,
    options: { required?: boolean; maxLength?: number } = {},
) => {
    const input = new TextInputBuilder()
        .setCustomId(fieldId)
        .setStyle(style)
        .setRequired(options.required ?? false);
    if (options.maxLength) input.setMaxLength(options.maxLength);
    if (value) input.setValue(value);
    return new LabelBuilder().setLabel(label).setTextInputComponent(input);
};

export const buildLocationDetailsModal = (location: LocationRow) =>
    new ModalBuilder()
        .setCustomId(`${ModalCustomIdPrefix.LocationEdit}:${LocationPanelAction.EditDetails}:${location.Id}`)
        .setTitle("Edit location details")
        .addLabelComponents(
            textInputLabel(LocationFieldId.Address, "Address", TextInputStyle.Short, location.Address, { maxLength: 200 }),
            textInputLabel(LocationFieldId.Description, "Description", TextInputStyle.Paragraph, location.Description, { maxLength: 1000 }),
            textInputLabel(LocationFieldId.Keywords, "Keywords (comma-separated)", TextInputStyle.Short, location.Keywords, { maxLength: 200 }),
            textInputLabel(LocationFieldId.Hours, "Hours", TextInputStyle.Short, location.Hours, { maxLength: 200 }),
            textInputLabel(LocationFieldId.Url, "Website URL", TextInputStyle.Short, location.Url, { maxLength: 500 }),
        );

export const buildLocationRenameModal = (location: LocationRow) =>
    new ModalBuilder()
        .setCustomId(`${ModalCustomIdPrefix.LocationEdit}:${LocationPanelAction.Rename}:${location.Id}`)
        .setTitle("Rename location")
        .addLabelComponents(
            textInputLabel(LocationFieldId.Name, "Name", TextInputStyle.Short, location.Name, { required: true, maxLength: 100 }),
        );

export const buildAddImageModal = (locationId: number) =>
    new ModalBuilder()
        .setCustomId(`${ModalCustomIdPrefix.LocationEdit}:${LocationPanelAction.AddImage}:${locationId}`)
        .setTitle("Add image")
        .addLabelComponents(
            textInputLabel(LocationFieldId.Image, "Image URL", TextInputStyle.Short, null, { required: true, maxLength: 500 }),
        );
