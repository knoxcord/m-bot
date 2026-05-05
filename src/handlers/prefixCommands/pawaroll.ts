import type { OmitPartialGroupDMChannel, Message} from "discord.js";
import { MessageFlags } from "discord.js";
import { buildResponse } from "../../features/roll/builders.ts";
import type { DiceRollResult, DieRollResult, RollDefinition } from "../../features/roll/rollTypes.ts";
import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";

const Key = CommandKey.PawaRoll

const handler = async (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    const notations = ["1d20"];

    const rollDefinition: RollDefinition = {
        numberOfDice: 1,
        numberOfSides: 20
    }

    const rollResults: DiceRollResult = {
        dieRollResults: [
            <DieRollResult>{
                number: 20,
                isDropped: false
            }
        ],
        sum: 20
    }

    const components = buildResponse([rollResults], [rollDefinition], notations);
    await message.reply({
        components: [components],
        flags: MessageFlags.IsComponentsV2
    });
}

export const PawaRoll: IPrefixCommand = {
    handler: handler,
    key: Key
}