import { OmitPartialGroupDMChannel, Message, MessageFlags } from "discord.js";
import { buildResponse } from "../../features/roll/builders.js";
import { doRoll } from "../../features/roll/roll.js";
import { RollSeparator } from "../../features/roll/rollTypes.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { CommandPrefix } from "./index.js";
import { parseNotatedRolls } from "../../features/roll/lexer.js";

const Key = CommandKey.Roll

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    const contentString = message.content.slice(CommandPrefix.length + Key.length).trim();
    const notations = contentString?.split(RollSeparator) ?? [];
    if (!notations)
        return;

    let reply = "";
    const rollDefinitions = parseNotatedRolls(notations)
    
    if (!rollDefinitions.success) {
        reply = rollDefinitions.errorMessage;
        await message.reply({
            content: reply
        });
        return;
    }

    const rollResults = rollDefinitions.data.map(doRoll);
    const components = buildResponse(rollResults, rollDefinitions.data, notations);
    await message.reply({
        components: [components],
        flags: MessageFlags.IsComponentsV2
    });
}

export const Roll: IPrefixCommand = {
    handler: handler,
    key: Key
}