import * as dotenv from "dotenv";
import { DiscordManager } from "./scripts/DiscordManager.js";
import { DataManger } from "./scripts/DataManager.js";

dotenv.config();

DiscordManager.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log("Discord login successful!");
        return DataManger.loadCache()
    })
    .then(() => {
        console.log("DataManager successfully loaded!");
        DataManger.startListen();
    });

process.on("SIGINT", () => {
    DataManger.stopListen();
    DiscordManager.logoff();
    process.exit();
});
