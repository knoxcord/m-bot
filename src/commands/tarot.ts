import { ChatInputCommandInteraction, LabelBuilder, ModalBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { ICommand } from "./commandTypes.js";

const Name = "tarot";
const Description = "Starts a tarot read";

const builder = new SlashCommandBuilder().setName(Name).setDescription(Description);

const examplePurposes = [
    "Tell me about my future",
    "Will today be a good day?",
    "Should I quit my job?"
]
const getPurposePlaceholder = () => examplePurposes[Math.floor(Math.random() * examplePurposes.length)]

const getTarotPurposeInput = () => {
    const tarotPurposeInput = new TextInputBuilder()
        .setCustomId("tarotPurpose")
        .setPlaceholder(getPurposePlaceholder())
        .setStyle(TextInputStyle.Short)
        .setRequired(false);
    return new LabelBuilder()
        .setLabel("What are you pulling for?")
        .setDescription("The text you enter here is private and will not be included in public results")
        .setTextInputComponent(tarotPurposeInput);
}

const getTarotPullTypeInput = () => {
    const tarotPullTypeInput = new StringSelectMenuBuilder()
        .setCustomId("tarotPullType")
        .setOptions(
            new StringSelectMenuOptionBuilder().setLabel("One").setDescription("Single card pull").setValue("single"),
            new StringSelectMenuOptionBuilder().setLabel("Three").setDescription("Three card pull").setValue("triple").setDefault()
        )
        .setRequired(false);
    return new LabelBuilder()
        .setLabel("How Many Cards?")
        .setStringSelectMenuComponent(tarotPullTypeInput);
}

const getTarotIsPublicInput = () => {
    const tarotIsPublicInput = new StringSelectMenuBuilder()
        .setCustomId("tarotIsPublic")
        .setOptions(
            new StringSelectMenuOptionBuilder().setLabel("Yes").setDescription("Posts the tarot pull publicly").setValue("true").setDefault(),
            new StringSelectMenuOptionBuilder().setLabel("No").setDescription("Posts the tarot pull privately").setValue("false")
        )
        .setRequired(false);
    return new LabelBuilder()
        .setLabel("Post Result Publicly?")
        .setStringSelectMenuComponent(tarotIsPublicInput);
}


const handler = async (interaction: ChatInputCommandInteraction) => {
    const modal = new ModalBuilder()
        .setCustomId("tarotSetup")
        .setTitle("New Tarot Read")
        .addLabelComponents(
            getTarotPurposeInput(),
            getTarotPullTypeInput(),
            getTarotIsPublicInput()
        );

    await interaction.showModal(modal);
}

export const Tarot: ICommand<ChatInputCommandInteraction, void> = {
    builder: builder,
    handler: handler,
    name: Name
}