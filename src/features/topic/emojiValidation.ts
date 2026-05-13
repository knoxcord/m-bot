import type { Client } from "discord.js";
import { inlineCode } from "discord.js";

const customEmojiPattern = /<a?:(\w+):(\d+)>/g;

export const findInaccessibleCustomEmoji = (text: string, client: Client): string[] => {
    const names: string[] = [];
    for (const match of text.matchAll(customEmojiPattern)) {
        if (!client.emojis.cache.has(match[2])) {
            names.push(match[1]);
        }
    }
    return names;
};

export const buildInaccessibleEmojiMessage = (names: string[]) =>
    `I don't have access to the following emoji, so I can't save this topic: ${names.map(inlineCode).join(", ")}`;
