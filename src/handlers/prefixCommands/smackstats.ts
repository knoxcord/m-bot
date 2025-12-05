import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { spankStatsHandler } from "./spankstats.js";

export const Key = CommandKey.SmackStats;

export const SmackStats: IPrefixCommand = {
    handler: spankStatsHandler,
    key: Key
}