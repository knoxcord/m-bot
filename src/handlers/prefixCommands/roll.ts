import type { OmitPartialGroupDMChannel, Message} from "discord.js";
import { MessageFlags, inlineCode } from "discord.js";
import { buildResponse } from "../../features/roll/builders.ts";
import { doRoll } from "../../features/roll/roll.ts";
import { RollSeparator } from "../../features/roll/rollTypes.ts";
import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";
import { parseNotatedRolls } from "../../features/roll/lexer.ts";

const Key = CommandKey.Roll

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>, commandBody: string) => {
    const notations = commandBody.split(RollSeparator) ?? [];
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
    key: Key,
    description: "Executes one or more notated dice rolls",
    usage: `Usage: ${inlineCode("roll [notation]")}. Ex: ${inlineCode("roll 4d20dl1, 3d6kh1")}`
}