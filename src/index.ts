// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits } from 'discord.js';
import config from './config.json' with { type: "json" };

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, (interaction) => {
	if (!interaction.isChatInputCommand()) return; 
	console.log(interaction);
});

// Log in to Discord with your client's token
client.login(config.token);