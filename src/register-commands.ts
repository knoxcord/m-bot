import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import config from './config.json' with { type: "json" };
import { Ping } from './commands/ping.js';

const commands: SlashCommandBuilder[] = [];
commands.push(Ping.data)

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(config.token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data: unknown = await rest.put(Routes.applicationCommands(config.clientId), { body: commands.map(command => command.toJSON()) });

		console.log(`Successfully reloaded ${(data as { length: string | number }).length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();