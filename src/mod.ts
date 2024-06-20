import type * as cmdk from "./cmdk.ts";
import { Hono } from "hono";
import blob from "./blob.ts";
import sqlite from "./sqlite.ts";
import val from "./val.ts";
import user from "./user.ts";

export type Variables = {
  token: string;
};

export function createApp(token: string): Hono<{
  Variables: Variables;
}> {
  const app = new Hono<{
    Variables: Variables;
  }>();

  app.use("/*", async (c, next) => {
    c.set("token", token);
    await next();
  });

  app.get("/", (c) => {
    return c.json({
      type: "list",
      icon: "https://pomdtr-favicon.web.val.run/val-town",
      title: "Val Town",
      items: [
        {
          title: "Search Vals",
          icon: "https://api.iconify.design/codicon/code.svg",
          actions: [
            {
              title: "Run Command",
              icon: "https://api.iconify.design/codicon/play.svg",
              onAction: {
                type: "push",
                page: `/vals`,
              },
            },
          ],
        },
        {
          title: "Search Blobs",
          icon: "https://api.iconify.design/codicon/file.svg",
          actions: [
            {
              title: "Run Command",
              icon: "https://api.iconify.design/codicon/play.svg",
              onAction: {
                type: "push",
                page: "/blobs",
              },
            },
          ],
        },
        {
          title: "Create New Val",
          icon: "https://api.iconify.design/codicon/add.svg",
          actions: [
            {
              title: "Run Command",
              icon: "https://api.iconify.design/codicon/play.svg",
              onAction: {
                type: "push",
                page: "/vals/new",
              },
            },
          ],
        },
        {
          title: "Search SQLite Tables",
          icon: "https://api.iconify.design/codicon/database.svg",
          actions: [
            {
              title: "Run Command",
              icon: "https://api.iconify.design/codicon/play.svg",
              onAction: {
                type: "push",
                page: "/sqlite/tables",
              },
            },
          ],
        },
        {
          title: "Execute Query",
          icon: "https://api.iconify.design/codicon/play.svg",
          actions: [
            {
              title: "Open",
              icon: "https://api.iconify.design/codicon/play.svg",
              onAction: {
                type: "push",
                page: "/sqlite/query",
              },
            },
          ],
        },
        {
          title: "Open API Reference",
          icon: "https://api.iconify.design/codicon/book.svg",
          actions: [
            {
              title: "Open",
              icon: "https://api.iconify.design/codicon/globe.svg",
              onAction: {
                type: "open",
                url: "https://api.val.town/documentation",
              },
            },
          ],
        },
      ],
    } satisfies cmdk.List);
  });

  app.route("/", blob);
  app.route("/", val);
  app.route("/", sqlite);
  app.route("/", user);

  return app;
}
