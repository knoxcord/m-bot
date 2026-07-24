import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import type { SubmissionRow } from "../../../../database/types.ts";
import { SubmissionStatus, SubmissionType } from "../../../submissionReview/types.ts";
import { deriveAnonymousIdentity, deriveIdentity, seedHash } from "./anonymousIdentity.ts";
import { codenameFromHash } from "./anonymousNames.ts";

const makeSubmission = (overrides: Partial<SubmissionRow> = {}): SubmissionRow => ({
    Id: 1,
    GuildId: "guild-1",
    SubmittedByUserId: "user-1",
    Content: "hello",
    SourceChannelId: "channel-1",
    SourceMessageId: "message-1",
    Status: SubmissionStatus.Accepted,
    Type: SubmissionType.TopicIntegration,
    Metadata: null,
    ReviewMessageId: null,
    ReviewedByUserId: null,
    CreatedAt: "2026-01-01 12:00:00",
    ReviewedAt: null,
    ...overrides,
});

describe("seedHash", () => {
    it("is deterministic for the same seed", () => {
        assert.equal(seedHash("abc"), seedHash("abc"));
    });

    it("differs for different seeds", () => {
        assert.notEqual(seedHash("abc"), seedHash("abd"));
    });

    it("always returns an unsigned 32-bit integer", () => {
        for (const seed of ["", "a", "user-1:message-1", "🕵️", "x".repeat(50)]) {
            const h = seedHash(seed);
            assert.ok(Number.isInteger(h), `${seed} produced a non-integer`);
            assert.ok(h >= 0 && h <= 0xFFFFFFFF, `${seed} produced ${h}, out of uint32 range`);
        }
    });
});

describe("codenameFromHash", () => {
    it("is deterministic and formatted as 'Adjective Noun #NNNN'", () => {
        const name = codenameFromHash(123456);
        assert.equal(name, codenameFromHash(123456));
        assert.match(name, /^\S.* \S.* #\d{4}$/);
    });

    it("keeps the numeric suffix in the 0000-9999 range for a wide sweep of hashes", () => {
        // Step across the whole uint32 space; every suffix must be exactly four digits.
        for (let h = 0; h <= 0xFFFFFFFF; h += 0x1FFFFF) {
            const suffix = codenameFromHash(h).match(/#(\d{4})$/)?.[1];
            assert.ok(suffix !== undefined, `hash ${h} produced no 4-digit suffix`);
            const value = Number(suffix);
            assert.ok(value >= 0 && value <= 9999, `hash ${h} produced suffix ${value}`);
        }
    });

    it("varies its parts independently across nearby hashes", () => {
        // Adjacent hashes should not all collapse to the same adjective/noun/suffix.
        const names = new Set(Array.from({ length: 100 }, (_, i) => codenameFromHash(i)));
        assert.ok(names.size > 90, `expected mostly distinct codenames, got ${names.size}/100`);
    });
});

describe("deriveAnonymousIdentity", () => {
    it("is stable for the same submitter within the same topic", () => {
        const a = deriveAnonymousIdentity(makeSubmission());
        const b = deriveAnonymousIdentity(makeSubmission({ Id: 2, Content: "different text" }));
        assert.deepEqual(a, b);
    });

    it("gives the same submitter a different identity across topics", () => {
        // Seeded by source message, so a person's color/codename should not carry between topics.
        const identities = Array.from({ length: 200 }, (_, i) =>
            deriveAnonymousIdentity(makeSubmission({ SourceMessageId: `message-${i}` })));
        const distinctCodenames = new Set(identities.map(x => x.codename));
        assert.ok(distinctCodenames.size >= 195, `expected near-unique codenames, got ${distinctCodenames.size}/200`);
    });

    it("gives different submitters different identities on the same topic", () => {
        const distinct = new Set(Array.from({ length: 200 }, (_, i) =>
            deriveAnonymousIdentity(makeSubmission({ SubmittedByUserId: `user-${i}` })).codename));
        assert.ok(distinct.size >= 195, `expected near-unique codenames, got ${distinct.size}/200`);
    });

    it("produces a color within the packed 0xRRGGBB range", () => {
        for (let i = 0; i < 500; i++) {
            const { color } = deriveAnonymousIdentity(makeSubmission({ SourceMessageId: `m-${i}` }));
            assert.ok(color >= 0 && color <= 0xFFFFFF, `got out-of-range color ${color}`);
        }
    });

    it("always maps to a Gen 1 dex sprite (1-151)", () => {
        for (let i = 0; i < 500; i++) {
            const { spriteUrl } = deriveAnonymousIdentity(makeSubmission({ SourceMessageId: `m-${i}` }));
            const dex = Number(spriteUrl.match(/\/(\d+)\.png$/)?.[1]);
            assert.ok(dex >= 1 && dex <= 151, `sprite dex ${dex} out of Gen 1 range for ${spriteUrl}`);
        }
    });

    it("matches deriveIdentity for the same submitter + source message", () => {
        // The modal previews the codename via deriveIdentity; it must equal what the embeds derive
        // from the persisted submission, or the preview would lie.
        const fromFields = deriveIdentity("user-42", "message-99");
        const fromRow = deriveAnonymousIdentity(makeSubmission({ SubmittedByUserId: "user-42", SourceMessageId: "message-99" }));
        assert.deepEqual(fromFields, fromRow);
    });
});
