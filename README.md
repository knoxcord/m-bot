# m-bot

## Installation
### Prerequisites:
The project requires node to build and run. It has been developed using the latest version of node at the time of writing (node 24). Prior versions may work, but are untested.

You must supply a discord bot token and client id. Place these values in `./src/config.json` using `./src/example.config.json` as a template.

### Installation
This project uses yarn. To install dependencies ensure you have corepack enabled and run
`yarn install`

Before running the bot you must register its slash commands. To do this, execute `yarn register-commands`

### Running
To run the bot, execute `yarn start`
