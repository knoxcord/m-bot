import type { ChatInputCommandInteraction} from "discord.js";
import { ActivityType, MessageFlags, inlineCode, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import config from "../../config.json" with { type: "json" };
import type { ISlashCommand } from "./commandTypes.ts";
import { CommandKey } from "./commandTypes.ts";

const Key = CommandKey.SetActivity;
const Description = "Set the bot's activity status";
const TextOption = "text";
const TypeOption = "type";
const UrlOption = "url";

const activityTypeChoices = [
    { name: "Playing", value: ActivityType.Playing },
    { name: "Streaming (requires URL)", value: ActivityType.Streaming },
    { name: "Listening", value: ActivityType.Listening },
    { name: "Watching", value: ActivityType.Watching },
    { name: "Custom (no prefix)", value: ActivityType.Custom },
    { name: "Competing", value: ActivityType.Competing },
] as const;

const activityTypeLabels: Record<number, string> = Object.fromEntries(
    activityTypeChoices.map(choice => [choice.value, choice.name]),
);

const builder = new SlashCommandBuilder()
    .setName(Key)
    .setDescription(Description)
    .addStringOption(option =>
        option.setName(TextOption)
            .setDescription("Text to display. Leave empty to clear the activity.")
            .setRequired(false))
    .addIntegerOption(option =>
        option.setName(TypeOption)
            .setDescription("Activity type (defaults to Playing)")
            .setRequired(false)
            .addChoices(...activityTypeChoices.map(choice => ({ name: choice.name, value: choice.value }))))
    .addStringOption(option =>
        option.setName(UrlOption)
            .setDescription("Stream URL (Twitch/YouTube) — required when type is Streaming")
            .setRequired(false))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);

const handler = async (interaction: ChatInputCommandInteraction) => {
    if (interaction.user.id !== config.ownerId) {
        await interaction.reply({ content: "Only the bot owner can use this command.", flags: MessageFlags.Ephemeral });
        return;
    }

    const text = interaction.options.getString(TextOption);
    const type = (interaction.options.getInteger(TypeOption) ?? ActivityType.Playing) as ActivityType;
    const url = interaction.options.getString(UrlOption) ?? undefined;
    const botUser = interaction.client.user;

    if (!botUser) {
        await interaction.reply({ content: "Bot user is not available.", flags: MessageFlags.Ephemeral });
        return;
    }

    if (!text) {
        botUser.setActivity();
        await interaction.reply("Cleared activity");
        return;
    }

    if (type === ActivityType.Streaming && !url) {
        await interaction.reply({ content: "A stream URL is required for Streaming activities, or Discord will fall back to Playing.", flags: MessageFlags.Ephemeral });
        return;
    }

    if (type === ActivityType.Custom) {
        botUser.setActivity({ name: text, state: text, type });
        await interaction.reply(`Set custom status to ${inlineCode(text)}`);
        return;
    }

    botUser.setActivity({ name: text, type, url });
    await interaction.reply(`Set activity to ${activityTypeLabels[type]} ${inlineCode(text)}`);
};

export const SetActivity: ISlashCommand = {
    builder: builder,
    handler: handler,
    key: Key
};
