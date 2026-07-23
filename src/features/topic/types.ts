export const TopicVoteCustomIdKey = "topicvote";
export const TopicManageCustomIdKey = "topicmanage";

export enum TopicManageAction {
    Edit = "edit",
    Delete = "delete",
    ConfirmDelete = "confirm-delete",
    CancelDelete = "cancel-delete",
}

export enum TopicEditFieldId {
    TopicText = "topic-text",
    IntegrationKey = "topic-integration",
}

/** Value of the "None" option in the integration select; maps to a null IntegrationKey. */
export const TopicIntegrationNoneSelectValue = "none";

// --- Topic integrations: pluggable behavior a topic can trigger when it's posted ---

// customId prefix for the button rendered under a topic (dispatched by integration key)
export const TopicIntegrationStartCustomIdKey = "topicintegration";

/** Known topic integrations. Stored in Topics.IntegrationKey. */
export enum TopicIntegrationKey {
    AnonymousPost = "anonymous",
}

/**
 * Describes a topic integration at the trigger level only: how it's labelled and what
 * button appears under the topic. What the integration actually *does* (its modal,
 * review, side-effects — if any) lives in its own concrete code, so unrelated
 * integrations aren't forced through one abstraction.
 */
export interface TopicIntegrationDefinition {
    /** Value stored in Topics.IntegrationKey and encoded in the button customId. */
    key: TopicIntegrationKey;
    /** Human label shown in the integration select when assigning one to a topic. */
    displayName: string;
    /** Label of the button rendered under the posted topic. */
    buttonLabel: string;
    buttonEmoji?: string;
}
