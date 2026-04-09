import { OmitPartialGroupDMChannel, Message, bold, quote } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { prefixCommands } from "./index.js";

// This does not check whether the user can actually use any of the functions in the help message
const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
    const matchedCommand = prefixCommands.find(command => commandBody.startsWith(command.key));
    if (matchedCommand) {
        const matchingHelpMessage = matchedCommand.helpMessage ?? `There is no help message for command ${matchedCommand.key}`;
        message.reply(`${matchedCommand.key} help:\n${matchingHelpMessage}`);
        return;
    }

    const helpMessage = prefixCommands
        .filter(command => command.helpMessage)
        .map(command => `${bold(command.key)} help:\n${quote(command.helpMessage!)}\n`);
    message.reply(helpMessage.join("\n"));
}

export const Help: IPrefixCommand = {
    handler: handler,
    key: CommandKey.Help,
    helpMessage: "Posts this message"
}