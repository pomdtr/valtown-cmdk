import * as cmdk from "./cmdk.ts";
import { Hono } from "hono";
import blob from "./blob.ts";
import val from "./val.ts";
import { bearerAuth } from "hono/bearer-auth";

declare module "hono" {
  interface ContextVariableMap {
    token: string;
  }
}

const app = new Hono();
app.use(
  "/*",
  bearerAuth({
    verifyToken: (token, c) => {
      c.set("token", token);
      return token != "";
    },
  })
);

app.get("/", (c) => {
  return c.json({
    type: "list",
    items: [
      {
        title: "Search Vals",
        icon: "https://api.iconify.design/codicon/code.svg",
        actions: [
          {
            title: "Run Command",
            type: "push",
            url: `/val/list`,
          },
        ],
      },
      {
        title: "Search Blobs",
        icon: "https://api.iconify.design/codicon/file.svg",
        actions: [
          {
            title: "Run Command",
            type: "push",
            url: "/blob/list",
          },
        ],
      },
      {
        title: "Create Val",
        icon: "https://api.iconify.design/codicon/add.svg",
        actions: [
          {
            title: "Run Command",
            type: "push",
            url: "/val/create",
          },
        ],
      },
    ],
  } satisfies cmdk.List);
});

app.route("/blob", blob);
app.route("/val", val);

export default app;
