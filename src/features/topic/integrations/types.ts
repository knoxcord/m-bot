/** Value of the "None" option in the integration select; maps to a null IntegrationKey. */
export const TopicIntegrationNoneSelectValue = "none";

// customId prefix for the button rendered under a topic (dispatched by integration key)
export const TopicIntegrationStartCustomIdKey = "topicintegration";

export enum TopicIntegrationKey {
    AnonymousReply = "anonymous",
}

export interface TopicIntegrationDefinition {
    key: TopicIntegrationKey;
    /** Human label shown in the integration select when assigning one to a topic. */
    displayName: string;
    /** Label of the button rendered under the posted topic. */
    buttonLabel: string;
    buttonEmoji?: string;
}

export enum TopicIntegrationType {
    AnonymousSubmit = "anonymous-submit"
}

interface AnonymousSubmitSubmissionPayload {
    TopicIntegrationType: TopicIntegrationType.AnonymousSubmit;
    /** The submitted text, republished verbatim as the anonymous reply once approved. */
    Content: string;
}

export type TopicIntegrationSubmissionPayload = AnonymousSubmitSubmissionPayload;