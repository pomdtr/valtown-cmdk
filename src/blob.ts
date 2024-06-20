import { Hono } from "hono";
import { fetchAPI } from "./api.ts";
import type * as cmdk from "./cmdk.ts";
import type { Variables } from "./mod.ts";

const app = new Hono<{
  Variables: Variables;
}>();

app.get("/blobs", async (c) => {
  const resp = await fetchAPI("/v1/blob", {
    token: c.get("token"),
  });
  if (!resp.ok) {
    return resp;
  }

  const blobs = (await resp.json()) as {
    key: string;
    size: string;
    lastModified: string;
  }[];

  return c.json({
    type: "list",
    title: "Blobs | Val Town",
    icon: "https://pomdtr-favicon.web.val.run/val-town",

    items: blobs.map(
      (blob) =>
        ({
          title: blob.key,
          icon: "https://api.iconify.design/codicon/file.svg",
          actions: [
            {
              title: "View Blob Content",
              icon: "https://api.iconify.design/codicon/eye.svg",
              onAction: {
                type: "push",
                page: `/blob/${encodeURIComponent(blob.key)}`,
              },
            },
            {
              title: "Delete Blob",
              icon: "https://api.iconify.design/codicon/trash.svg",
              onAction: {
                type: "run",
                command: `/blob/${blob.key}/delete`,
                onSuccess: "reload",
              },
            },
            {
              title: "Create Blob",
              icon: "https://api.iconify.design/codicon/add.svg",
              onAction: {
                type: "push",
                page: `/blobs/new?pop=true`,
              },
            },
          ],
        } satisfies cmdk.ListItem)
    ),
  } satisfies cmdk.List);
});

app.get("/blobs/new", async (c) => {
  if (c.req.method === "POST") {
    await fetchAPI("/v1/blob", {
      method: "POST",
      body: await c.req.text(),
      token: c.get("token"),
    });
  }

  return c.json({
    icon: "https://pomdtr-favicon.web.val.run/val-town",

    type: "form",
    onSubmit: {
      type: "run",
    },
    title: `New Blob | Val Town`,
    items: [
      {
        type: "textfield",
        title: "Key",
        name: "key",
      },
      {
        type: "textarea",
        title: "Content",
        name: "content",
      },
    ],
  } satisfies cmdk.Form);
});

app.get("/blob/:key", async (c) => {
  const key = c.req.param("key");
  const extension = key.split(".").slice(1).pop();

  const resp = await fetchAPI(`/v1/blob/${encodeURIComponent(key)}`, {
    token: c.get("token"),
  });
  if (!resp.ok) {
    return resp;
  }

  const content = await resp.text();
  return c.json({
    icon: "https://pomdtr-favicon.web.val.run/val-town",

    type: "detail",
    title: `Blob: ${key} | Val Town`,
    markdown: ["```" + extension || "", content, "```"].join("\n"),
    actions: [
      {
        title: "Copy Blob",
        icon: "https://api.iconify.design/codicon/clippy.svg",
        onAction: {
          type: "copy",
          text: content,
        },
      },
      {
        title: "Edit Blob",
        icon: "https://api.iconify.design/codicon/edit.svg",
        onAction: {
          type: "push",
          page: `/blob/edit/${key}`,
        },
      },
      {
        title: "Delete Blob",
        icon: "https://api.iconify.design/codicon/trash.svg",
        onAction: {
          type: "run",
          command: `/blob/delete/${key}`,
          onSuccess: "pop",
        },
      },
    ],
  } satisfies cmdk.Detail);
});

app.all("/blob/:key/edit", async (c) => {
  const key = c.req.param("key");
  if (c.req.method === "POST") {
    const { content } = await c.req.json();

    const resp = await fetchAPI(`/v1/blob/${encodeURIComponent(key)}`, {
      method: "POST",
      body: content,
      token: c.get("token"),
    });

    if (!resp.ok) {
      return resp;
    }

    return c.json({
      type: "push",
      url: `/blob/view/${encodeURIComponent(key)}`,
    });
  }

  const blob = await fetchAPI(`/v1/blob/${encodeURIComponent(key)}`, {
    token: c.get("token"),
  });

  return c.json({
    type: "form",
    onSubmit: {
      type: "run",
    },
    title: `Edit Blob: ${key} | Val Town`,
    items: [
      {
        type: "textarea",
        title: "Content",
        name: "content",
        value: await blob.text(),
      },
    ],
  } satisfies cmdk.Form);
});

app.post("/blob/:key/delete", async (c) => {
  const key = c.req.param("key");
  const resp = await fetchAPI(`/v1/blob/${encodeURIComponent(key)}`, {
    method: "DELETE",
    token: c.get("token"),
  });

  if (!resp.ok) {
    return resp;
  }

  return new Response(null, {
    status: 204,
  });
});

export default app;
