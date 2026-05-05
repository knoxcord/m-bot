import { awardHandler } from "../../features/award/award.ts";
import type { IPrefixCommand } from "./prefixCommandTypes.ts";
import { CommandKey } from "./prefixCommandTypes.ts";

export const Award: IPrefixCommand = {
    handler: awardHandler,
    key: CommandKey.Award,
}