import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Compiles to build/config.js, so climb out of build/ to the project root.
// config.json holds secrets, is gitignored, and lives alongside the app on the
// server (not bundled into the build). See docs/deployment.md.
const ConfigPath = "../config.json";

export interface Config {
    token: string;
    clientId: string;
    ownerId: string;
    assetSrc: string;
    letterGeneratorUrl: string;
}

const config = JSON.parse(
    fs.readFileSync(path.join(__dirname, ConfigPath), "utf-8"),
) as Config;

export default config;
