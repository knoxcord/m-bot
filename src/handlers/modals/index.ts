import { Tarot } from "./tarot.ts";
import { TopicEdit } from "./topicEdit.ts";
import { TopicAdd } from "./topicAdd.ts";
import { LocationEdit } from "./locationEdit.ts";
import { TopicAnonResponse } from "./topicAnonymousSubmit.ts";
import { NewsAdd } from "./newsAdd.ts";
import { NewsEdit } from "./newsEdit.ts";

const modals = [
    Tarot,
    TopicEdit,
    TopicAdd,
    LocationEdit,
    TopicAnonResponse,
    NewsAdd,
    NewsEdit,
];

export {
    modals
};