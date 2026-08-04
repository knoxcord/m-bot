import type { ChatInputCommandInteraction} from "discord.js";
import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import type { ISlashCommand } from "./commandTypes.ts";
import { CommandKey } from "./commandTypes.ts";
import { generateLetter } from "../../features/communityNews/letterGenerator/api.ts";

const Key = CommandKey.GetLetter;

enum FieldNameEnum {
    Title = "title",
    Body = "body",
}

const builder = new SlashCommandBuilder()
    .setName(Key)
    .setDescription("Get letter")
    .addStringOption(stringOption => stringOption.setName(FieldNameEnum.Title).setDescription("Letter title").setRequired(true))
    .addStringOption(stringOption => stringOption.setName(FieldNameEnum.Body).setDescription("Letter body").setRequired(true));

const IMAGE_NAME = "letter.webp";

const generateLetterHandler = async (interaction: ChatInputCommandInteraction) => {
    const title = interaction.options.getString(FieldNameEnum.Title, true);
    const body = interaction.options.getString(FieldNameEnum.Body, true);

    await interaction.deferReply();

    const response = await generateLetter({
        Title: title,
        Body: body,
        Author: interaction.user.displayName
    })

    if (!response) {
        await interaction.editReply("Sorry, I couldn't generate that letter.");
        return;
    }

    const file = new AttachmentBuilder(Buffer.from(await response.arrayBuffer()), { name: IMAGE_NAME });

    await interaction.editReply({ files: [file] });
};

export const GetLetter: ISlashCommand = {
    builder: builder,
    handler: generateLetterHandler,
    key: Key
}

 