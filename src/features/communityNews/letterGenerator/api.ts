import type { GenerateLetterRequest } from "./types.ts";
import config from "../../../config.ts";

export const generateLetter = async (request: GenerateLetterRequest) => {
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

    if (!response.ok) {
        console.error(`Got ${response.status} ${response.statusText} from letter generator: ${await response.text()}`);
        return null;
    }

    return response;
}