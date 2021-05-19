import * as path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
export const dirname = path.dirname(filename);

export const JSON_DATA_KEY = "08222";

export const REFRESH_TIMEOUT = 1000 * 60 * 5;
export const TREND_DAYS = 5;
export const THRESHOLD_DAYS = 5;
export const THRESHOLD_DAY_OFFSET = 2;
export const THRESHOLD_VALUE = 100;

export const ARROWS = {
    up: "➚",
    down: "➘"
};

export const DAYS = [
    "So",
    "Mo",
    "Di",
    "Mi",
    "Do",
    "Fr",
    "Sa",
];
