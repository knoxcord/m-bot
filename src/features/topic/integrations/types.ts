export enum TopicIntegrationType {
    AnonymousSubmit = "anonymous-submit"
}

export interface TopicIntegrationSubmissionMetadata {
    TopicIntegrationType: TopicIntegrationType
}