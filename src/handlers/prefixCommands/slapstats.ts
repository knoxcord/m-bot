import { CommandKey, IPrefixCommand } from "./prefixCommandTypes.js";
import { spankStatsHandler } from "./spankstats.js";

export const Key = CommandKey.SlapStats;

export const SlapStats: IPrefixCommand = {
    handler: spankStatsHandler,
    key: Key
}