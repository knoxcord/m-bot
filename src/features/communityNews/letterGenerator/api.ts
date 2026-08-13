import type { GenerateLetterRequest, GeneratedLetter } from "./types.ts";
import config from "../../../config.ts";

const StationeryHeader = "Letter-Stationery";

/**
 * Generates a letter image. Returns undefined when the generator isn't configured and null when it
 * couldn't be reached or refused the request.
 */
export const generateLetter = async (request: GenerateLetterRequest): Promise<GeneratedLetter | null | undefined> => {
    if (!config.letterGeneratorUrl) {
        console.warn("Letter generator url not configured, returning...");
        return;
    }

    let response: Response;
    try {
        response = await fetch(config.letterGeneratorUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
    } catch (error) {
        console.error(`Failed to fetch ${config.letterGeneratorUrl}:`, (error as Error).cause ?? error);
        return null;
    }

    // Gracefully handle invalid stationery. Should never happen, but still...
    if (response.status === 400 && request.Stationery) {
        console.warn(`Letter generator rejected stationery '${request.Stationery}', retrying without it`);
        return generateLetter({ ...request, Stationery: undefined });
    }

    if (!response.ok) {
        console.error(`Got ${response.status} ${response.statusText} from letter generator: ${await response.text()}`);
        return null;
    }

    return {
        image: Buffer.from(await response.arrayBuffer()),
        stationery: response.headers.get(StationeryHeader),
    };
}
