import { AddTopic } from "./addTopic.ts";
import { Configure } from "./configure.ts";
import { TopicManage } from "./topicManage.ts";
import { Feature } from "./feature.ts";
import { LocationInfo } from "./locationInfo.ts";
import { LocationManage } from "./locationManage.ts";
import { Ping } from "./ping.ts";
import { Roll } from "./roll.ts";
import { SetActivity } from "./setActivity.ts";
import { Tarot } from "./tarot.ts";
import { Version } from "./version.ts";

const slashCommands = [
    Ping,
    Tarot,
    Roll,
    Version,
    Configure,
    Feature,
    LocationInfo,
    LocationManage,
    SetActivity,
    TopicManage,
    AddTopic,
] as const;

export {
    slashCommands
};