import type { SharedSlashCommand } from 'discord.js';
import { REST, Routes } from 'discord.js';
import config from './config.ts';
import { slashCommands } from './handlers/slashCommands/index.ts';


// Construct and prepare an instance of the REST module
const rest = new REST().setToken(config.token);

// Protect against duplicate registrations. We could technically do this, but would need to update handler logic and also handle deduping stuff like descriptions
const toRegister: SharedSlashCommand [] = [];
const loadedCommandNames: string[] = [];

slashCommands.forEach(command => {
	if (loadedCommandNames.includes(command.key)) {
		console.error("Found multiple commands with the same name, this is not supported");
		process.exit(1);
	}

	loadedCommandNames.push(command.key);
	toRegister.push(command.builder);
});

// Register commands
(async () => {
	try {
		console.info(`Started refreshing ${toRegister.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data: unknown = await rest.put(Routes.applicationCommands(config.clientId), { body: toRegister.map(builder => builder.toJSON()) });

		console.info(`Successfully reloaded ${(data as { length: string | number }).length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();