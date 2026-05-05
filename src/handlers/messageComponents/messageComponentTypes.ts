import type { MessageComponentInteraction } from "discord.js";
import { TarotCustomIdKey } from "../../features/tarot/types.ts";
import { TopicVoteCustomIdKey } from "../../features/topic/types.ts";

export enum MessageComponentCustomIdPrefix {
    Tarot = TarotCustomIdKey,
    TopicVote = TopicVoteCustomIdKey,
}

export interface IMessageComponent {
    /** This custom id represents the key for the interaction */
    customIdPrefix: MessageComponentCustomIdPrefix;
    /** This is the handler function to be called upon modal submit for matching custom id */
    handler: (interaction: MessageComponentInteraction) => Promise<unknown>
}
