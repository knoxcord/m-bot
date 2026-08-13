export interface GenerateLetterRequest {
    Title: string,
    Body: string,
    Valediction: string,
    /** Name of the stationery to draw on. Omit to have the generator pick one that is in season. */
    Stationery?: string,
}

export interface GeneratedLetter {
    image: Buffer,
    /** The stationery drawn on, to store and send back when redrawing this letter. */
    stationery: string,
}
