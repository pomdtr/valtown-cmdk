import { Hono } from "hono";
import { fetchAPI } from "val-town-api";
import * as cmdk from "./cmdk.ts";

const app = new Hono();

app.get("/user/:id", async (c) => {
  const resp = await fetchAPI(`/v1/users/${c.req.param("id")}`, {
    token: c.get("token"),
  });

  if (!resp.ok) {
    return resp;
  }

  const user = await resp.json();
  return c.json({
    type: "detail",
    title: `User ${user.username} | Val Town`,
    markdown: [`# ${user.username}`, user.bio].join("\n"),
  } satisfies cmdk.Detail);
});

app.get("/u/:username", async (c) => {
  const resp = await fetchAPI(c.req.param("username"), {
    token: c.get("token"),
  });

  if (!resp.ok) {
    return resp;
  }

  const user = await resp.json();
  return c.redirect(`/u/${user.id}`);
});

export default app;
