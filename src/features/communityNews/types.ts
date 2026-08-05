export enum NewsAddFieldId {
    Title = "title",
    Body = "body",
};

export const NewsMessageCustomIdKey = 'news';

export enum NewsAddButtonIds {
    ChangeBackground = 'newbg',
    Post = 'post'
};

export const LetterImageName = "letter.webp";

export interface CommunityNewsSubmissionMetadata {
    NewsDraftId: number;
}
