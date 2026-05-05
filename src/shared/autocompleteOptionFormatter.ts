const AutocompleteOptionNameMaxLength = 99;
const TruncationIndicator = "...";

/** Discord caps autocomplete responses at 25 entries. */
export const AutocompleteResultLimit = 25;

export const formatAutocompleteName = (optionName: string) => {
    if (optionName.length <= AutocompleteOptionNameMaxLength)
        return optionName;

    return `${optionName.slice(0,AutocompleteOptionNameMaxLength - TruncationIndicator.length)}${TruncationIndicator}`;
}
