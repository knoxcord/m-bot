export enum NewsAddFieldId {
    Title = "title",
    Body = "body",
    Tag = "tag",
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
