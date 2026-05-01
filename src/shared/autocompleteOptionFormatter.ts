const AutocompleteOptionNameMaxLength = 99;
const TruncationIndicator = "...";

export const formatAutocompleteName = (optionName: string) => {
    if (optionName.length <= AutocompleteOptionNameMaxLength)
        return optionName;

    return `${optionName.slice(0,AutocompleteOptionNameMaxLength - TruncationIndicator.length)}${TruncationIndicator}`;
}
