import { Hono } from "hono";
import { fetchAPI } from "val-town-api";
import * as cmdk from "./cmdk.ts";
import { zip } from "https://esm.town/v/pomdtr/sql";

const app = new Hono();

app.all("/sqlite/query", async (c) => {
  const query = c.req.query("sql");
  if (!query) {
    return c.json({
      type: "form",
      title: "Query Editor | Val Town",
      onSubmit: {
        type: "push",
      },
      items: [
        {
          name: "sql",
          title: "Query",
          required: true,
          type: "textarea",
        },
      ],
    } satisfies cmdk.Form);
  }

  const resp = await fetchAPI("/v1/sqlite/execute", {
    token: c.get("token"),
    method: "POST",
    body: JSON.stringify({
      statement: {
        sql: query,
        args: [],
      },
    }),
  });

  if (!resp.ok) {
    return resp;
  }

  const res = await resp.json();
  return c.json({
    type: "detail",
    title: "Query Result | Val Town",
    markdown: ["```json", JSON.stringify(zip(res), null, 2), "```"].join("\n"),
  } as cmdk.Detail);
});

app.get("/sqlite/tables", async (c) => {
  const resp = await fetchAPI("/v1/sqlite/execute", {
    token: c.get("token"),
    method: "POST",
    body: JSON.stringify({
      statement: {
        sql: "SELECT name FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%';",
        args: [],
      },
    }),
  });

  if (!resp.ok) {
    return resp;
  }

  const { rows } = (await resp.json()) as { rows: any[][] };

  return c.json({
    type: "list",
    title: "SQLite Tables | Val Town",
    items: rows.map((row) => ({
      title: row[0],
      actions: [
        {
          title: "View Table Schema",
          onAction: { type: "push", page: `/sqlite/table/${row[0]}/schema` },
        },
      ],
    })),
  } satisfies cmdk.List);
});

app.get("/sqlite/table/:name/schema", async (c) => {
  const resp = await fetchAPI("/v1/sqlite/execute", {
    token: c.get("token"),
    method: "POST",
    body: JSON.stringify({
      statement: {
        sql: `PRAGMA table_info(${c.req.param("name")});`,
        args: [],
      },
    }),
  });

  const rows = zip(await resp.json());
  return c.json({
    type: "list",
    title: `Table Schema: ${c.req.param("name")} | Val Town`,
    items: rows.map((row) => ({
      title: row.name,
      subtitle: row.type,
      icon: "https://api.iconify.design/codicon/symbol-string.svg",
    })),
  } satisfies cmdk.List);
});

export default app;
