import { createApp } from "./src/mod.ts";

const token = Deno.env.get("valtown");
if (!token) {
  console.log("This script is meant to be run in the Val Town environment.");
  Deno.exit(1);
}

export default createApp(token);
