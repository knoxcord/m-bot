import { MessageComponentInteraction } from "discord.js";
import { TarotCustomIdKey } from "../../features/tarot/types.js";

export enum MessageComponentCustomIdPrefix {
    Tarot = TarotCustomIdKey
}

export interface IMessageComponent {
    /** This custom id represents the key for the interaction */
    customIdPrefix: MessageComponentCustomIdPrefix;
    /** This is the handler function to be called upon modal submit for matching custom id */
    handler: (interaction: MessageComponentInteraction) => Promise<unknown>
}
