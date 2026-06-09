import type { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, MessageComponentInteraction, ModalSubmitInteraction } from 'discord.js';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import config from './config.ts';
import { slashCommands } from './handlers/slashCommands/index.ts';
import { modals } from './handlers/modals/index.ts';
import { messageComponents } from './handlers/messageComponents/index.ts';
import { prefixCommands } from './handlers/prefixCommands/index.ts';
import { handleRoleActivityMessage, scheduleRoleActivityHourlyJob } from './features/roleActivity/roleActivity.ts';
import { handleChannelOrderUpdate } from './features/channelOrder/channelOrder.ts';
import { handleAutoTopicMessage, initializeAutoTopicTimers } from './features/topic/autoTopic.ts';
import { restoreTemporaryRoles } from './features/temporaryRoles/temporaryRoles.ts';

// mock code change
const CommandPrefix = "-";

const client = new Client({ intents: [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent,
] });

client.once(Events.ClientReady, (readyClient) => {
	console.info(`Ready! Logged in as ${readyClient.user.tag}`);
	scheduleRoleActivityHourlyJob(readyClient);
	initializeAutoTopicTimers(readyClient);
	restoreTemporaryRoles(readyClient).catch(error => console.error('Error restoring temporary roles:', error));
});

const slashCommandLookup = Object.fromEntries(
	slashCommands.map(command => [command.key, command.handler]),
);
const autocompleteHandlerLookup = Object.fromEntries(
	slashCommands.filter(command => command.autocompleteHandler).map(command => [command.key, command.autocompleteHandler!]),
);
const handleChatInputCommand = (interaction: ChatInputCommandInteraction<CacheType>) => {
	const commandHandler = slashCommandLookup[interaction.commandName];

	if (commandHandler) {
		commandHandler(interaction);
		return;
	}

	console.warn(`Received command "${interaction.commandName}" with no matching handler. Did you forget to register commands?`)
}

const modalSubmitHandlerLookup = Object.fromEntries(modals.map(modal => [modal.customIdPrefix, modal.handler]));
const handleModalSubmit = (interaction: ModalSubmitInteraction<CacheType>) => {
	const interactionCustomIdPrefix = interaction.customId.split(':')[0];
	const modalSubmitHandler = modalSubmitHandlerLookup[interactionCustomIdPrefix];

	if (modalSubmitHandler) {
		modalSubmitHandler(interaction).catch(error => console.error(`Error handling modal submit for "${interaction.customId}":`, error));
		return;
	}

	console.warn(`Received modal submit for custom id "${interaction.customId}" with no matching handler`)
}

const messageComponentHandlerLookup = Object.fromEntries(messageComponents.map(messageComponent => [messageComponent.customIdPrefix, messageComponent.handler]));
const handleMessageComponent = (interaction: MessageComponentInteraction<CacheType>) => {
	const interactionCustomIdPrefix = interaction.customId.split(':')[0];
	const messageComponentHandler = messageComponentHandlerLookup[interactionCustomIdPrefix];

	if (messageComponentHandler) {
		messageComponentHandler(interaction).catch(error => console.error(`Error handling message component for "${interaction.customId} by user ${interaction.user.id}":`, error));
		return;
	}

	console.warn(`Received message component interaction for custom id "${interaction.customId}" with no matching handler`)
}

const handleAutocomplete = (interaction: AutocompleteInteraction<CacheType>) => {
	const autocompleteHandler = autocompleteHandlerLookup[interaction.commandName];

	if (autocompleteHandler) {
		autocompleteHandler(interaction).catch(error => console.error(`Error handling autocomplete for "${interaction.commandName}":`, error));
		return;
	}

	console.warn(`Received autocomplete for command "${interaction.commandName}" with no matching handler`);
}

client.on(Events.InteractionCreate, (interaction) => {
	if (interaction.isChatInputCommand()) {
		handleChatInputCommand(interaction);
		return;
	} else if (interaction.isAutocomplete()) {
		handleAutocomplete(interaction);
		return;
	} else if (interaction.isModalSubmit()) {
		handleModalSubmit(interaction);
		return;
	} else if (interaction.isMessageComponent()) {
		handleMessageComponent(interaction);
		return;
	}
});

client.on(Events.ChannelUpdate, handleChannelOrderUpdate);

client.on(Events.MessageCreate, (message) => {
	if (message.content.startsWith(CommandPrefix)) {
		const messageCommand = message.content.slice(CommandPrefix.length).split(" ")[0].toLowerCase();
		const matchedCommand = prefixCommands.find(command => command.key === messageCommand);
		if (matchedCommand && !matchedCommand.mentionOnly) {
			const commandBody = message.content.slice(matchedCommand.key.length + CommandPrefix.length).trim();
			matchedCommand.handler(message, commandBody);
		}
	}

	if (!client.user || message.author.bot)
		return;

	const meMention = `<@${client.user.id}>`;
	if (message.content.startsWith(meMention)) {
		// Index 1 here because there should be a space after the mention unlike when using command prefix
		const messageCommand = message.content.slice(meMention.length).split(" ")[1]?.toLowerCase() ?? "";
		const matchedCommand = prefixCommands.find(command => command.key === messageCommand);
		if (matchedCommand) {
			// Plus 1 for the space between mention and key
			const commandBody = message.content.slice(matchedCommand.key.length + meMention.length + 1).trim();
			matchedCommand.handler(message, commandBody);
		}
	}

	handleRoleActivityMessage(message);
	handleAutoTopicMessage(message);

	const insultPattern = new RegExp(`fuck(?:\\syou)?\\s+(?:<@!?${client.user.id}>|${message.guild?.members.me?.displayName ?? client.user.displayName})`, 'i');
	if (insultPattern.test(message.content))
		message.reply(`Fuck you ${message.author.displayName}`);
});

client.login(config.token);