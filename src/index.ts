// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits } from 'discord.js';
import config from './config.json' with { type: "json" };
import commands from './commands/index.js';

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once).
client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Handle interaction events
const commandLookup = Object.fromEntries(commands.map(command => [command.name, command.handler]));
client.on(Events.InteractionCreate, (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	// Check known commands for a match
	const foundHandler = commandLookup[interaction.commandName];
	if (foundHandler)
		foundHandler(interaction);
	else
		console.warn(`Received command "${interaction.commandName}" with no matching handler. Did you forget to register commands?`)
});

// Log in to Discord with your client's token
client.login(config.token);