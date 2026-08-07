import type { SubmissionStatus, SubmissionType } from "../features/submissionReview/types.ts";
import type { TopicIntegrationKey } from "../features/topic/integrations/types.ts";

export interface LocationRow {
    Id: number;
    GuildId: string;
    Name: string;
    Address: string | null;
    Description: string | null;
    Keywords: string | null;
    Hours: string | null;
    Url: string | null;
    AddedByUserId: string;
    CreatedAt: string;
}

export interface LocationImageRow {
    Id: number;
    LocationId: number;
    ImageUrl: string;
    AddedByUserId: string;
    CreatedAt: string;
}

export interface TopicRow {
    Id: number;
    GuildId: string;
    Topic: string;
    AddedByUserId: string;
    CreatedAt: string;
    LastShownAt: string | null;
    ShownCount: number;
    IntegrationKey: TopicIntegrationKey | null;
}

export interface SubmissionRow {
    Id: number;
    GuildId: string;
    SubmittedByUserId: string;
    SourceChannelId: string;
    SourceMessageId: string | null;
    Status: SubmissionStatus;
    Type: SubmissionType;
    /** Serialized, type-specific data */
    Payload: string;
    ReviewMessageId: string | null;
    ReviewedByUserId: string | null;
    CreatedAt: string;
    ReviewedAt: string | null;
}

export interface NewsDraftRow {
    Id: number;
    GuildId: string;
    AuthorUserId: string;
    Valediction: string;
    Title: string;
    Body: string;
    /** The generated letter image. Kept here so the approved post uses the exact image the author saw. */
    Image: Buffer;
    /** Set when the draft is claimed for review; guards against a draft being submitted twice. */
    SubmittedAt: string | null;
    SubmissionId: number | null;
    CreatedAt: string;
    UpdatedAt: string;
}

export interface TopicWithVotesRow extends TopicRow {
    Upvotes: number;
    Downvotes: number;
}

export interface TopicWeightingRow {
    Id: number;
    AddedByUserId: string;
    LastShownAt: string | null;
    Upvotes: number;
    Downvotes: number;
}

export enum TopicVote {
    Up = 0,
    Down = 1,
}

export interface TemporaryRoleAssignmentRow {
    GuildId: string;
    UserId: string;
    RoleId: string;
    ExpiresAt: number;
}