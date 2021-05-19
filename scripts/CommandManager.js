import * as path from "path";
import * as fs from "fs";
import { Debug } from "./Debug.js";
import { addDebug, removeDebug, sendDebug } from "./commands/debugChannel.js";
import { DiscordManager } from "./DiscordManager.js";
import { addAlert, removeAlert, sendAlert } from "./commands/alertChannel.js";
import { addStat, removeStat, sendStats } from "./commands/alert.js";
import { dirname } from "../globals.js";

const configFile = path.join(dirname, "config.json");

const COMPONENT = "CommandManager";

class _CommandManager {
    constructor () {
        this.channelCommands = {
            addDebug,
            removeDebug,
        };

        this.dmCommands = {
            add: addStat,
            remove: removeStat,
            addAlert,
            removeAlert,
        };

        this.invokeCommands = {
            sendDebug,
            sendAlert,
            sendStats,
        };

        // commands containing private informations
        this.doNotDebug = [
        ];

        this.config = null;

        this.currentCommand = null;

        this.loadConfig();
    }

    async loadConfig () {
        if (!fs.existsSync(configFile)) {
            this.config = {};
            return;
        }

        const json = await fs.promises.readFile(configFile);
        this.config = JSON.parse(json);
    }

    async saveConfig () {
        const json = JSON.stringify(this.config, null, 2);
        await fs.promises.writeFile(configFile, json);
    }

    async invokeCommand (command, ...args) {
        const handler = this.invokeCommands[command];

        if (!handler) {
            return;
        }

        await handler.apply(this, args);
    }

    async execCommand (discordMessage, command, args, isDM) {
        if (!this.doNotDebug.includes(command)) {
            Debug.log(`command: ${command}, args: ${JSON.stringify(args)}`, COMPONENT);
        } else {
            Debug.log(`command: ${command}, args: <private>`, COMPONENT);
        }

        if (this.currentCommand) {
            DiscordManager.reply(discordMessage, "There is already a command running! Please wait until it's done and submit your command again");
            return;
        }


        const handler = isDM ? this.dmCommands[command] : this.channelCommands[command];

        if (!handler) {
            DiscordManager.reply(discordMessage, `The command "${command}" does not exist or is not enabled for this scope`);
            return;
        }

        this.currentCommand = command;

        try {
            await handler.call(this, discordMessage, ...args);
        } catch (err) {
            Debug.error(err.message);
        }

        this.currentCommand = null;
    }
}

export const CommandManager = new _CommandManager();
