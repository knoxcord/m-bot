import { Guild, GuildMember, quote, userMention } from "discord.js";
import config from "../../config.json" with { type: "json" }

export const assignRole = async (targetUser: GuildMember, score: number) => {
    // Remove any relevent already assigned roles
    await Promise.all(
        [config.unsortedRoleId, config.monkRoleId, config.normieRoleId, config.performerRoleId]
            .filter(roleId => targetUser.roles.cache.has(roleId))
            .map(roleId => targetUser.roles.remove(roleId))
    );

    // Assign the correct role based on the score
    let newRole = config.performerRoleId;
    if (score >= 90) {
        newRole = config.monkRoleId;
    } else if (score >= 80) {
        newRole = config.normieRoleId;
    }
    await targetUser.roles.add(newRole);
    return newRole;
}

const WelcomeMessage: ((mention: string) => string)[] = [
    mention => `A wild ${mention} appeared!`,
    mention => `Welcome ${mention} to the team!`,
    mention => `Wow they sure let anyone in here, huh, ${mention}?`,
    mention => `${mention} is here! Now we're really cookin'`,
    mention => `${quote("New role who dis?")}\n\\- ${mention}`
];

const getWelcomeMessage = (targetUser: GuildMember) => {
    const index = Math.floor(Math.random() * WelcomeMessage.length);
    const mention = userMention(targetUser.id);
    return WelcomeMessage[index](mention);
}

export const sendWelcomeMessage = async (targetUser: GuildMember, newRole: string, guild: Guild) => {
    let welcomeChannelId: string | undefined;
    switch(newRole) {
        case config.monkRoleId:
            welcomeChannelId = config.monkChannelId;
            break;
        case config.normieRoleId:
            welcomeChannelId = config.normieChannelId;
            break;
        case config.performerRoleId:
            welcomeChannelId = config.performerChannelId;
            break;
    };
    const welcomeChannel = welcomeChannelId ? await guild.channels.fetch(welcomeChannelId) : undefined;
    if (welcomeChannel && welcomeChannel.isTextBased()) {
        try {
            await welcomeChannel.send(getWelcomeMessage(targetUser));
        } catch (error) {
            console.error(`Failed to send welcome message to channel ${welcomeChannelId}:`, error);
        }
    }
}