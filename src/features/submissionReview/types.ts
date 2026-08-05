export const SubmissionReviewCustomIdKey = "submission-review";

export enum SubmissionReviewAction {
    Accept = "accept",
    Reject = "reject",
}

export enum SubmissionStatus {
    Pending = "pending",
    Accepted = "accepted",
    Rejected = "rejected",
}

export enum SubmissionType {
    TopicIntegration = "topic-integration",
    CommunityNews = "community-news",
}
