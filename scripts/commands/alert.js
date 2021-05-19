import { DiscordManager } from "../DiscordManager.js";

export async function addStat (discordMessage) {
    const channelId = discordMessage.channel.id;
    if (!Array.isArray(this.config.statChannels)) {
        this.config.statChannels = [];
    }

    if (!this.config.statChannels.includes(channelId)) {
        this.config.statChannels.push(channelId);
    }
    await this.saveConfig();
}

export async function removeStat (discordMessage) {
    const channelId = discordMessage.channel.id;
    if (!Array.isArray(this.config.statChannels)) {
        return;
    }
    const index = this.config.statChannels.findIndex((channel) => {
        return channel === channelId;
    });
    if (index > -1) {
        this.config.statChannels.splice(index, 1);
    }
    await this.saveConfig();
}

export async function sendStats (msg) {
    if (!Array.isArray(this.config.statChannels)) {
        return;
    }
    this.config.statChannels.forEach((channel) => {
        DiscordManager.send(channel, msg);
    });
}