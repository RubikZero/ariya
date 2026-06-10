import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

const secret = randomBytes(32).toString("hex");

console.log("Generated secret:");
console.log(secret);

spawnSync(
    "npx",
    ["wrangler", "secret", "put", "HMAC_SECRET_KEY"],
    {
        input: secret,
        encoding: "utf-8",
        stdio: ["pipe", "inherit", "inherit"]
    }
);