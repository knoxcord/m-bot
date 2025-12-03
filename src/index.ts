import { CacheType, ChatInputCommandInteraction, Client, Events, GatewayIntentBits, MessageComponentInteraction, ModalSubmitInteraction } from 'discord.js';
import config from './config.json' with { type: "json" };
import { slashCommands } from './handlers/slashCommands/index.js';
import { modals } from './handlers/modals/index.js';
import { messageComponents } from './handlers/messageComponents/index.js';
import { prefixCommands, CommandPrefix } from './handlers/prefixCommands/index.js';

const client = new Client({ intents: [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent,
] });

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

const slashCommandLookup = Object.fromEntries(slashCommands.map(command => [command.key, command.handler]));
const handleChatInputCommand = (interaction: ChatInputCommandInteraction<CacheType>) => {
	const commandHandler = slashCommandLookup[interaction.commandName];

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

client.on(Events.MessageCreate, (message) => {
	if (!message.content.startsWith(CommandPrefix))
		return;

	const messageCommand = message.content.slice(CommandPrefix.length).split(" ")[0];
	const matchedCommand = prefixCommands.find(command => command.key === messageCommand);
	if (matchedCommand)
		matchedCommand.handler(message);
});

client.login(config.token);