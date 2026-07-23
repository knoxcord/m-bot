import type { ConfigurationRegistration } from "../configuration/configurationTypes.ts";

export const SubmissionReviewChannelIdConfigurationKey = 'SUBMISSION_REVIEW_CHANNEL_ID';

export const submissionReviewConfigurationRegistrations = <ConfigurationRegistration[]>[
    ['Submission Review Channel Id (Where Topic Integration Submissions Are Sent For Approval)', SubmissionReviewChannelIdConfigurationKey],
];