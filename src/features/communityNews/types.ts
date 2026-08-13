export enum NewsAddFieldId {
    Title = "title",
    Body = "body",
};

export const NewsMessageCustomIdKey = 'news';

export enum NewsAddButtonIds {
    ChangeBackground = 'newbg',
    ChangeValediction = 'newsign',
    EditText = 'edit',
    Post = 'post'
};

export const LetterImageName = "letter.webp";

export interface CommunityNewsSubmissionPayload {
    NewsDraftId: number;
}
