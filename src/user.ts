import { Hono } from "hono";
import { fetchAPI } from "./api.ts";
import type * as cmdk from "./cmdk.ts";
import type { Variables } from "./mod.ts";

const app = new Hono<{
  Variables: Variables;
}>();

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
    icon: "https://pomdtr-favicon.web.val.run/val-town",
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
