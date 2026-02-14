const MissingPermission: string[] = [
    "Ooph. This must be embarassing for you",
    "And you are...?",
    "I don't take orders from strangers",
    "You didn't say the magic word"
];

export const getMissingPermissionResponse = () => {
    const index = Math.floor(Math.random() * MissingPermission.length);
    return MissingPermission[index];
}