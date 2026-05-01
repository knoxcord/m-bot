import { OmitPartialGroupDMChannel, Message, bold, quote, inlineCode } from "discord.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { prefixCommands } from "./index.js";

const getHelpBlurb = (command: IPrefixCommand) => `\
${bold(command.key)} help:\
${command.description ? `\n${quote(command.description)}` : ""}\
${command.usage ? `\n${quote(command.usage)}` : ""}\
${command.mentionOnly ? `\n(only works with bot mention)` : ""}`;

const getShortHelpBlurb = (command: IPrefixCommand) => `${bold(command.key)} - ${command.description}`;

// This does not check whether the user can actually use any of the functions in the help message
const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
    const matchedCommand = prefixCommands.find(command => commandBody === command.key);
    if (matchedCommand) {
        const helpMessage = matchedCommand.description || matchedCommand.usage
            ? getHelpBlurb(matchedCommand)
            : `There is no help message for command ${bold(matchedCommand.key)}`;
        message.reply(helpMessage);
        return;
    }

    const helpMessage = prefixCommands
        .filter(command => command.description)
        .map(getShortHelpBlurb);
    message.reply(`Use ${inlineCode("help <command>")} for more info on these:\n${helpMessage.join("\n")}`);
}

export const Help: IPrefixCommand = {
    handler: handler,
    key: CommandKey.Help,
    description: "Posts this message",
    mentionOnly: true
}