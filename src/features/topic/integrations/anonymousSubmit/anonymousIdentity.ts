import config from "../../../../config.ts";
import type { SubmissionRow } from "../../../../database/types.ts";
import { codenamePartsFromHash, formatCodename } from "./anonymousNames.ts";

const spriteUrlForDex = (dex: number, isShiny: boolean = false): string =>
    `${config.assetSrc}/sprites/pokemon/official-artwork/${isShiny ? 'shiny/' : ''}${dex}.png`;

// Converts an HSL color to a packed 0xRRGGBB integer for Discord embed colors.
const hslToInt = (h: number, s: number, l: number): number => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    const [r, g, b] =
        h < 60 ? [c, x, 0] :
        h < 120 ? [x, c, 0] :
        h < 180 ? [0, c, x] :
        h < 240 ? [0, x, c] :
        h < 300 ? [x, 0, c] :
        [c, 0, x];
    const to255 = (v: number) => Math.round((v + m) * 255);
    return (to255(r) << 16) | (to255(g) << 8) | to255(b);
};

// djb2 hash of the seed, as an unsigned 32-bit int. The seed combines the submitter with the
// source message, so a given person gets one stable value within a topic but a different one
// across topics. Anonymity is preserved: this is a one-way hash, never the raw user id.
export const seedHash = (seed: string): number => {
    let hash = 5381;
    for (let i = 0; i < seed.length; i++)
        hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0;
    return hash >>> 0;
};

// Hue drives the accent color; fixed saturation/lightness keeps every derived color vivid.
const colorFromHash = (hash: number): number => hslToInt(hash % 360, 0.65, 0.55);

export interface AnonymousIdentity {
    // Packed 0xRRGGBB accent color for the embed.
    color: number;
    // Friendly pseudonym, e.g. "Brave Pikachu #0427".
    codename: string;
    // Sprite for the identity, shown as the embed author icon.
    spriteUrl: string;
}

// Derives a stable, anonymity-preserving visual identity from the submitter + source message.
// Seeded so a person is consistent within a topic but differs across topics; the color, codename,
// and sprite all agree because they come from the same hash. Anonymity is preserved: it's a
// one-way hash, never the raw user id.
export const deriveIdentity = (submittedByUserId: string, sourceMessageId: string | null): AnonymousIdentity => {
    const hash = seedHash(`${submittedByUserId}:${sourceMessageId}`);
    const parts = codenamePartsFromHash(hash);
    return {
        color: colorFromHash(hash),
        codename: formatCodename(parts),
        // nounIndex is 0-based; +1 maps it to the Gen 1 National Dex number.
        // Use shiny sprite if user happened to get adjective "Shiny"
        spriteUrl: spriteUrlForDex(parts.nounIndex + 1, parts.adjective === 'Shiny'),
    };
};

export const deriveAnonymousIdentity = (submission: SubmissionRow): AnonymousIdentity =>
    deriveIdentity(submission.SubmittedByUserId, submission.SourceMessageId);
