# m-bot

## Permissions
The bot needs these permissions to use all features:

### Scopes:
- `applications.commands`
- `bot`

### Bot Permissions:
- `Add Reactions`
- `Attach Files`
- `Embed Links`
- `Manage Roles`
- `Manage Threads`
- `Read Message History`
- `Send Messages in Threads`
- `Send Messages`
- `Use External Emojis`

### Intents:
- Server Members Intent
- Message Content Intent

## Installation
### Prerequisites:
The project requires node to build and run. It has been developed using the latest version of node at the time of writing (node 24). Prior versions may work, but are untested.

You must supply a discord bot token and client id. Place these values in `./config.json` (project root) using `./example.config.json` as a template.

### Installation
This project uses yarn. To install dependencies ensure you have corepack enabled and run
`yarn install`

Before running the bot you must register its slash commands. To do this, execute `yarn register-commands`

### Running
To run the bot, execute `yarn start`

## Config

- `token`: discord bot app token
- `clientId`: discord bot app client id
- `assetSrc`: static image asset source base url
- `ownerId`: user id for the owner of the bot
- `letterGeneratorUrl`: URL to send community news generate letter POST requests