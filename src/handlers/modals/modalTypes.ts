import { ModalBuilder, ModalSubmitInteraction } from "discord.js";
import { ConfigurationRegistration } from "src/configuration/configurationTypes.js";

export enum ModalCustomId {
    Tarot = "tarot"
}

export interface IModal{
    /** This custom id represents the key for the interaction */
    customId: ModalCustomId;
    /** This is the handler function to be called upon modal submit for matching custom id */
    handler: (interaction: ModalSubmitInteraction) => Promise<unknown>
    /** builder function to use to create the modal */
    builder: () => ModalBuilder,
    /** This contains configuration registrations for modal handlers */
    configurationRegistrations?: ConfigurationRegistration[];
}
