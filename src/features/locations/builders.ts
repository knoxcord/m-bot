import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, LabelBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags, ModalBuilder, SeparatorBuilder, TextDisplayBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import type { LocationImageRow, LocationRow } from "../../database/db.ts";
import { LocationFieldId, LocationPanelAction, LocationPanelCustomIdKey } from "./types.ts";
import { ModalCustomIdPrefix } from "../../handlers/modals/modalTypes.ts";
import { normalizeUrl } from "../../shared/urlHelpers.ts";

const PanelColor = 0x2B82D1;
const DangerColor = 0xED4245;
/** Discord caps a message at 10 embeds / 5 action rows, and a MediaGallery at 10 items; stay within all. */
const MaxManagedImages = 10;

const panelButton = (action: LocationPanelAction, locationId: number) =>
    new ButtonBuilder().setCustomId(`${LocationPanelCustomIdKey}:${action}:${locationId}`);

// Shared renderer, /location-info and the edit panel render the same container, so editors see exactly
//   what viewers will get. Callers append buttons/footers.
export const buildLocationContainer = (location: LocationRow, images: LocationImageRow[]) => {
    const container = new ContainerBuilder().setAccentColor(PanelColor);

    // setURL throws on malformed URLs, so normalize/guard against legacy rows lacking a scheme.
    const websiteUrl = location.Url ? normalizeUrl(location.Url) : null;
    const heading = websiteUrl ? `## [${location.Name}](${websiteUrl})` : `## ${location.Name}`;
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(heading));

    if (location.Description) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(location.Description));
    }

    // V2 has no inline field grid, so render the populated fields as labelled markdown lines.
    const fieldLines: string[] = [];
    if (location.Address) fieldLines.push(`**Address:**\n${location.Address}`);
    if (location.Hours) fieldLines.push(`**Hours:**\n${location.Hours}`);
    if (location.Url) fieldLines.push(`**Website:**\n${location.Url}`);
    if (fieldLines.length > 0) {
        container.addSeparatorComponents(new SeparatorBuilder());
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(fieldLines.join("\n")));
    }

    // A single MediaGallery renders all images as one grid/carousel (up to 10 items).
    const gallery = new MediaGalleryBuilder();
    let shown = 0;
    for (const image of images.slice(0, MaxManagedImages)) {
        const normalized = normalizeUrl(image.ImageUrl);
        if (normalized) {
            gallery.addItems(new MediaGalleryItemBuilder().setURL(normalized));
            shown++;
        }
    }
    if (shown > 0) container.addMediaGalleryComponents(gallery);

    return container;
};

// "Added by @user on <date>" credit
const creditLine = (location: LocationRow) => {
    const created = Math.floor(new Date(location.CreatedAt).getTime() / 1000);
    const when = Number.isFinite(created) ? ` on <t:${created}:D>` : "";
    return `-# Added by <@${location.AddedByUserId}>${when}`;
};

// The edit panel is the same container plus the action buttons and footer
export const buildLocationPanel = (location: LocationRow, images: LocationImageRow[], isComplete: boolean = false) => {
    const container = buildLocationContainer(location, images);
    container.addSeparatorComponents(new SeparatorBuilder());
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(creditLine(location)));

    if (isComplete) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent("-# ✅ Done. Run `/location-manage edit` to make further changes."));
    } else {
        container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().setComponents(
            panelButton(LocationPanelAction.EditDetails, location.Id).setLabel("Edit details").setStyle(ButtonStyle.Secondary),
            panelButton(LocationPanelAction.Rename, location.Id).setLabel("Change name").setStyle(ButtonStyle.Secondary),
            panelButton(LocationPanelAction.ManageImages, location.Id).setLabel("Manage images").setStyle(ButtonStyle.Secondary),
            panelButton(LocationPanelAction.Refresh, location.Id).setLabel("Refresh data").setStyle(ButtonStyle.Secondary),
            panelButton(LocationPanelAction.Help, location.Id).setLabel("Formatting tips").setStyle(ButtonStyle.Secondary),
        ));
        container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().setComponents(
            panelButton(LocationPanelAction.Delete, location.Id).setLabel("Delete Location").setStyle(ButtonStyle.Danger),
            panelButton(LocationPanelAction.Done, location.Id).setLabel("Done").setStyle(ButtonStyle.Primary),
        ));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent("-# Changes save automatically. Press Done when finished."));
    }

    // The credit line mentions the creator; suppress the ping so re-rendering the panel doesn't notify them.
    return { components: [container], flags: MessageFlags.IsComponentsV2 as const, allowedMentions: { parse: [] } };
};

// Components V2 messages can't carry plain content/embeds, so status updates need their own container.
export const buildNotice = (message: string) => ({
    components: [new ContainerBuilder().setAccentColor(PanelColor).addTextDisplayComponents(new TextDisplayBuilder().setContent(message))],
    flags: MessageFlags.IsComponentsV2 as const,
});

// Deletion is destructive and cascades to the location's images, so we confirm before removing.
export const buildDeleteConfirmation = (location: LocationRow) => {
    const container = new ContainerBuilder()
        .setAccentColor(DangerColor)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Delete **${location.Name}**?`))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("This permanently removes the location and all of its images. This can't be undone."))
        .addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().setComponents(
            panelButton(LocationPanelAction.ConfirmDelete, location.Id).setLabel("Delete Location").setStyle(ButtonStyle.Danger),
            panelButton(LocationPanelAction.CancelDelete, location.Id).setLabel("Cancel").setStyle(ButtonStyle.Secondary),
        ));

    return { components: [container], flags: MessageFlags.IsComponentsV2 as const };
};

// A Components V2 message renders its top-level components top-to-bottom, which lets us place each
//   image's delete button directly beneath the image (classic embeds + action rows can't interleave).
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

// On "Done" collapse the per-image edit rows into a single gallery so the images read as one carousel
//   (the location-info look) rather than individual lines
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
    components.push(new TextDisplayBuilder().setContent("-# ✅ Done. Use \"Manage images\" button to make further changes."));

    return { components, flags: MessageFlags.IsComponentsV2 as const };
};

const textInputLabel = (
    fieldId: LocationFieldId,
    label: string,
    style: TextInputStyle,
    value: string | null,
    options: { required?: boolean; maxLength?: number; description?: string; placeholder?: string } = {},
) => {
    const input = new TextInputBuilder()
        .setCustomId(fieldId)
        .setStyle(style)
        .setRequired(options.required ?? false);
    if (options.maxLength) input.setMaxLength(options.maxLength);
    if (options.placeholder) input.setPlaceholder(options.placeholder);
    if (value) input.setValue(value);
    const labelBuilder = new LabelBuilder().setLabel(label).setTextInputComponent(input);
    if (options.description) labelBuilder.setDescription(options.description);
    return labelBuilder;
};

export const buildLocationDetailsModal = (location: LocationRow) =>
    new ModalBuilder()
        .setCustomId(`${ModalCustomIdPrefix.LocationEdit}:${LocationPanelAction.EditDetails}:${location.Id}`)
        .setTitle("Edit location details")
        .addLabelComponents(
            textInputLabel(LocationFieldId.Address, "Address", TextInputStyle.Paragraph, location.Address, { maxLength: 200 }),
            textInputLabel(LocationFieldId.Description, "Description", TextInputStyle.Paragraph, location.Description, { maxLength: 1000 }),
            textInputLabel(LocationFieldId.Hours, "Hours", TextInputStyle.Paragraph, location.Hours, { maxLength: 200 }),
            textInputLabel(LocationFieldId.Url, "Website URL", TextInputStyle.Short, location.Url, { maxLength: 500 }),
            textInputLabel(LocationFieldId.Keywords, "Keywords", TextInputStyle.Short, location.Keywords, {
                maxLength: 200,
                description: "Additional comma-separated search terms to help people find this location. Not shown publicly.",
                placeholder: "coffee, downtown, wifi, study spot",
            }),
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

const HelpText = [
    "All details fields are optional and will only be shown if they contain text. You can use [markdown formatting](https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline) in these fields.",
    "You can use emoji and mentions (channel, role, user, etc) in these fields, but you must use [escaped syntax](https://c.r74n.com/discord/formatting#EscapeMentions).",
].join("\n\n");

export const buildHelpMessage = () => ({ content: HelpText, flags: MessageFlags.Ephemeral as const });
