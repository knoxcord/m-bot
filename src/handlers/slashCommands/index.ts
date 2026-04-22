import { Configure } from "./configure.js";
import { Feature } from "./feature.js";
import { LocationInfo } from "./locationInfo.js";
import { LocationManage } from "./locationManage.js";
import { Ping } from "./ping.js";
import { Roll } from "./roll.js";
import { SetActivity } from "./setActivity.js";
import { Tarot } from "./tarot.js";
import { Version } from "./version.js";

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
] as const;

export {
    slashCommands
};