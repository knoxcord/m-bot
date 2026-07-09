import type { ModalSubmitInteraction } from "discord.js";

export enum ModalCustomIdPrefix {
    Tarot = "tarot",
    TopicEdit = "topic-edit",
    TopicAdd = "topic-add",
    LocationEdit = "location-edit",
}

export interface IModal{
    /** Prefix matched against the start of the modal's customId (delimited by ':') */
    customIdPrefix: ModalCustomIdPrefix;
    /** This is the handler function to be called upon modal submit for matching custom id */
    handler: (interaction: ModalSubmitInteraction) => Promise<unknown>
}
