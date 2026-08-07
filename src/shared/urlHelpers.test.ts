import assert from "assert";
import { describe, it } from "node:test";
import { extractAttachmentNameFromUrl, getMessageLink } from "./urlHelpers.ts";

describe("getMessageLink", () => {
    it("constructs message link in expected format", () => {
        const guildId = '123';
        const channelId = '456';
        const messageId = '789';

        const expected = 'https://discord.com/channels/123/456/789';

        assert.equal(getMessageLink(guildId, channelId, messageId), expected);
    })
})

describe("extractAttachmentNameFromUrl", () => {
    it("extracts expected attachment name", () => {
        const imageUrl = 'https://cdn.discordapp.com/attachments/1507449070401228900/1534594803357192265/letter.webp?ex=6a74b248&is=6a7360c8&hm=5d8d442e58448f191538dfb0c53c9e01bf0ee9fe1a15b8056bde1ea5ab9a7353&';

        const expected = 'letter.webp';

        assert.equal(extractAttachmentNameFromUrl(imageUrl), expected);
    });
});