import { OmitPartialGroupDMChannel, Message, MessageFlags } from "discord.js";
import { buildResponse } from "../../features/roll/builders.js";
import { DiceRollResult, DieRollResult, RollDefinition } from "../../features/roll/rollTypes.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";

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