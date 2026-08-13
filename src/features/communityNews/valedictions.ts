// Sign-off pool drawn from when writing a letter. The author's display name is appended to the
//   chosen line, so each entry has to read naturally with a name directly after it.
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
    "Completely sober,",
    "Tone: Announcing,",
    "Deuces,",
    "*Blinks twice*",
    "Sent From My iPhone",
    "Sent from my enclosure,",
    "Sent from the piss arcade,",
    "Currently on I40,",
    "XOXO,",
    "Keep it scruffy,",
    "Your most obedient & humble servant,",
    "P.S. Tell your mom I said hi,",
    "Warmestish regards,",
    "Nothing personal,",
    "Dictated but not read,",
    "Per my last post,",
    "Yours in Christ,",
    "Allegedly,",
    "Hope this helps,",
    "Proud of you,",
    "With all due respect,",
    "Knoxcord's finest,",
    "No further questions,",
    "You didn't hear it from me,",
    "Thoughts & prayers,",
    "Y'all stay outta trouble now,",
    "Kthxbye,",
    "Tenderly,",
    "Do with this what you will,",
    "Kiss the baby for me,",
    "Be good,",
    "Your secret admirer,",
    "Mic drop,",
    "Over and out,",
    "Govern yourselves accordingly,",
    "I've said too much,",
    "Please advise,",
    "See you in the funny papers,",
    "Sent From My Samsung Refrigerator,",
    "don't do anything I wouldn't do,",
    "just sayin,",
    "*kickflips*",
    "KACHOW,",
    "meow,",
    "I mean, what?",
    "Teehee,",
    "You've activated my trap card,",
];

/** The only two choices offered; the sign-off lines themselves aren't individually selectable. */
export enum ValedictionSelectValue {
    Random = "random",
    None = "none",
}

// Random picks here, at submit time, so the resolved line can be stored on the draft. Picking at
//   render time instead would reshuffle the sign-off every time the artwork is regenerated.
export const resolveValediction = (selectedValue: string, authorDisplayName: string) => {
    if (selectedValue === ValedictionSelectValue.None)
        return authorDisplayName;

    const valediction = Valedictions[Math.floor(Math.random() * Valedictions.length)];
    return `${valediction} ${authorDisplayName}`;
};
