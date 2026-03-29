import { awardHandler } from "../../features/award/award.js";
import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";

export const Award: IPrefixCommand = {
    handler: awardHandler,
    key: CommandKey.Award,
}