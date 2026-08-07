// Sign-offs offered when writing a letter. The author's display name is appended to the chosen
//   line, so each entry has to read naturally with a name directly after it.
export const Valedictions = [
    "Your pal,",
    "Your neighbor,",
    "Love,",
    "Don't be a stranger,",
    "See you at the Sunsphere,",
    "Stay cozy,",
    "Later, gator,",
    "Sweet dreams,",
    "Go touch some grass,",
    "Bon voyage,",
];

/** Select values for the two entries that aren't literal sign-offs. */
export enum ValedictionSelectValue {
    Random = "random",
    None = "none",
}

// Random picks here, at submit time, so the resolved line can be stored on the draft. Picking at
//   render time instead would reshuffle the sign-off every time the artwork is regenerated.
export const resolveValediction = (selectedValue: string, authorDisplayName: string) => {
    if (selectedValue === ValedictionSelectValue.None)
        return authorDisplayName;

    const valediction = selectedValue === ValedictionSelectValue.Random
        ? Valedictions[Math.floor(Math.random() * Valedictions.length)]
        : selectedValue;

    return `${valediction} ${authorDisplayName}`;
};
