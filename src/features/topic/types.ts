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
