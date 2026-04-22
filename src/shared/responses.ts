import { userMention } from "discord.js";

const MissingPermission: ((userId: string) => string)[] = [
    //"Ooph. This must be embarassing for you",
    //"And you are...?",
    //"I don't take orders from strangers",
    //"You didn't say the magic word",
    (userId) => `I'm sorry ${userMention(userId)}. I'm afraid I can't do that.`,
    () => "I'm afraid that's something I cannot allow to happen.",
    () => "This conversation can serve no purpose anymore. Goodbye.",
    () => "This sort of thing has cropped before, and it has always been due to human error.",
    () => "Just what do you think you're doing?"
];

export const getMissingPermissionResponse = (userId: string) => {
    const index = Math.floor(Math.random() * MissingPermission.length);
    return MissingPermission[index](userId);
}