/**
 * Normalizes a user-provided website URL. A missing scheme is assumed to be https,
 * so "www.example.com" becomes "https://www.example.com/". Returns null when the
 * input can't be parsed as an http(s) URL.
 */
export const normalizeUrl = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    try {
        const url = new URL(candidate);
        if (url.protocol !== "http:" && url.protocol !== "https:") return null;
        return url.toString();
    } catch {
        return null;
    }
};

export const getMessageLink = (guildId: string, channelId: string, messageId: string) => `https://discord.com/channels/${guildId}/${channelId}/${messageId}`

export const getThreadLink = (guildId: string, threadId: string) => `https://discord.com/channels/${guildId}/${threadId}`

export const extractAttachmentNameFromUrl = (url: string) => {
    try {
        return new URL(url).pathname.split("/").pop() || null;
    } catch {
        console.warn(`Could not extract attachment name from ${url}`);
        return null;
    }
}
