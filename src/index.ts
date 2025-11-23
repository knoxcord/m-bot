// Require the necessary discord.js classes
import { CacheType, ChatInputCommandInteraction, Client, Events, GatewayIntentBits, MessageComponentInteraction, ModalSubmitInteraction } from 'discord.js';
import config from './config.json' with { type: "json" };
import { commands } from './handlers/commands/index.js';
import { modals } from './handlers/modals/index.js';
import { messageComponents } from './handlers/messageComponents/index.js';

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once).
client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

const commandLookup = Object.fromEntries(commands.map(command => [command.key, command.handler]));
const handleChatInputCommand = (interaction: ChatInputCommandInteraction<CacheType>) => {
	const commandHandler = commandLookup[interaction.commandName];

	if (commandHandler) {
		commandHandler(interaction);
		return;
	}

	console.warn(`Received command "${interaction.commandName}" with no matching handler. Did you forget to register commands?`)
}

const modalSubmitHandlerLookup = Object.fromEntries(modals.map(modal => [modal.customId, modal.handler]));
const handleModalSubmit = (interaction: ModalSubmitInteraction<CacheType>) => {
	const modalSubmitHandler = modalSubmitHandlerLookup[interaction.customId];

	if (modalSubmitHandler) {
		modalSubmitHandler(interaction);
		return;
	}

	console.warn(`Received modal submit for custom id "${interaction.customId}" with no matching handler`)
}

const messageComponentHandlerLookup = Object.fromEntries(messageComponents.map(messageComponent => [messageComponent.customIdPrefix, messageComponent.handler]));
const handleMessageComponent = (interaction: MessageComponentInteraction<CacheType>) => {
	const interactionCustomIdPrefix = interaction.customId.split(':')[0];
	const messageComponentHandler = messageComponentHandlerLookup[interactionCustomIdPrefix];

	if (messageComponentHandler) {
		messageComponentHandler(interaction);
		return;
	}

	console.warn(`Received message component interaction for custom id "${interaction.customId}" with no matching handler`)
}

client.on(Events.InteractionCreate, (interaction) => {
	if (interaction.isChatInputCommand()) {
		handleChatInputCommand(interaction);
		return;
	} else if (interaction.isModalSubmit()) {
		handleModalSubmit(interaction);
		return;
	} else if (interaction.isMessageComponent()) {
		handleMessageComponent(interaction);
		return;
	}
});

// Log in to Discord with your client's token
client.login(config.token);