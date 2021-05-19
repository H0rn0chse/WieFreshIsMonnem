import * as path from "path";
import * as fs from "fs";
import fetch from "node-fetch";
import { ARROWS, DAYS, dirname, JSON_DATA_KEY, REFRESH_TIMEOUT, THRESHOLD_DAYS, THRESHOLD_VALUE, TREND_DAYS } from "../globals.js";
import { CommandManager } from "./CommandManager.js";
import { Debug } from "./Debug.js";

const cacheFile = path.join(dirname, "cache.json");
const COMPONENT = "DataManger";

class _DataManger {
    constructor () {
        this.cache = null;
    }
    async loadCache () {
        if (!fs.existsSync(cacheFile)) {
            this.cache = {
                data: {},
                lastUpdate: 0,
            };
            return;
        }

        const json = await fs.promises.readFile(cacheFile);
        this.cache = JSON.parse(json);
    }

    async saveCache () {
        const json = JSON.stringify(this.cache, null, 4);
        await fs.promises.writeFile(cacheFile, json);
    }

    startListen () {
        this.timer = setInterval(() => {
            this.fetchData();
        }, REFRESH_TIMEOUT);

        this.fetchData();
    }


    stopListen () {
        clearInterval(this.timer);
    }

    fetchData () {
        Debug.log("Fetching data", COMPONENT);
        fetch(`https://api.corona-zahlen.org/districts/${JSON_DATA_KEY}`)
            .then(res => res.json())
            .then(async (json) => {
                const cacheLastUpdate = new Date(this.cache.lastUpdate);
                const jsonLastUpdate = new Date(json.meta.lastUpdate);
                if (cacheLastUpdate >= jsonLastUpdate) {
                    //nothing changed
                    return;
                }

                await this.addEntry(json.data[JSON_DATA_KEY].weekIncidence, jsonLastUpdate);
            });
    }

    getKey (date) {
        return `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`
    }

    setDaysBefore (date, days) {
        date.setDate(date.getDate() - days);
    }

    async addEntry (value, date) {
        const key = this.getKey(date);
        this.cache.lastUpdate = date.toISOString();

        // Update during the day
        if (this.cache.data[key]) {
            Debug.log("Got new value for today", COMPONENT);
            const entry = this.cache.data[key];
            const oldValue = entry.data.value;
            const newValue = value.toFixed(2);

            entry.data.value = newValue;
            await this.saveCache();

            const msg = [
                "The todays value was updated:",
                `from ${oldValue} to ${newValue}`,
            ];

            return CommandManager.invokeCommand("sendStats", msg.join("\n"));
        }
        Debug.log("Got first value for today", COMPONENT);

        // First value of the day
        this.cache.data[key] = {
            data: {
                value: value.toFixed(2),
            },
        };
        await this.saveCache();
        return this.sendUpdate();
    }

    async sendUpdate() {
        const lastUpdate = this.cache.lastUpdate;
        let count = 0;
        for (let i = THRESHOLD_DAYS; i >= 0; i--) {
            const date = new Date(lastUpdate);
            this.setDaysBefore(date, i);
            const key = this.getKey(date);

            const entry = this.cache.data[key] || {};
            const value = parseFloat(entry?.data?.value || "0");
            if (value < THRESHOLD_VALUE && value > 0) {
                count += 1;
            } else {
                count = 0;
            }
        }

        let lastDay = 0;
        const values = [];
        for (let i = TREND_DAYS - 1; i >= 0; i--) {
            const date = new Date(lastUpdate);
            this.setDaysBefore(date, i);


            const key = this.getKey(date);
            const entry = this.cache.data[key] || {};
            const value = parseFloat(entry?.data?.value || "0");
            let trend = "";
            if (value > lastDay) {
                trend = ARROWS.up
            } else if (value < lastDay) {
                trend = ARROWS.down
            }

            let message = `${DAYS[date.getDay()]}: ${value} ${trend}`;
            values.push(message);
            lastDay = value;
        }

        const trend = values.join("\n")

        const msg = [
            "The todays value was published: ",
            `Mannheim is fresh für ${count} / ${THRESHOLD_DAYS} Tage`,
            " ",
            "**Trend**",
            trend,
        ];

        return CommandManager.invokeCommand("sendStats", msg.join("\n"));
    }
}

export const DataManger = new _DataManger();
