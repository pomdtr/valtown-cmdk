import { Hono } from "hono";
import { fetchAPI } from "val-town-api";
import * as cmdk from "./cmdk.ts";

const app = new Hono();

app.get("/list", async (c) => {
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
    items: blobs.map((blob) => ({
      title: blob.key,
      icon: "https://api.iconify.design/codicon/file.svg",
      actions: [
        {
          title: "View Blob Content",
          icon: "https://api.iconify.design/codicon/eye.svg",
          type: "push",
          url: `/blob/view/${encodeURIComponent(blob.key)}`,
        },
        {
          title: "Delete Blob",
          type: "run",
          icon: "https://api.iconify.design/codicon/trash.svg",
          url: `/blob/delete/${blob.key}?reload=true`,
        },
      ],
    })),
  } satisfies cmdk.List);
});

app.get("/view/:key", async (c) => {
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
    type: "detail",
    markdown: ["```" + extension || "", content, "```"].join("\n"),
    actions: [
      {
        title: "Copy Blob",
        icon: "https://api.iconify.design/codicon/clippy.svg",
        type: "copy",
        text: content,
      },
      {
        title: "Edit Blob",
        icon: "https://api.iconify.design/codicon/edit.svg",
        type: "push",
        url: `/blob/edit/${key}`,
      },
      {
        title: "Delete Blob",
        icon: "https://api.iconify.design/codicon/trash.svg",
        type: "run",
        url: `/blob/delete/${key}?pop=true`,
      },
    ],
  });
});

app.all("/blob/edit/:key", async (c) => {
  const key = c.req.param("key");
  if (c.req.method === "POST") {
    const { key, content } = await c.req.json();

    const resp = await fetchAPI(`/v1/blob/${encodeURIComponent(key)}`, {
      method: "POST",
      body: content,
      token: c.get("token"),
    });

    if (!resp.ok) {
      return resp;
    }

    if (c.req.query("pop")) {
      return c.json({ type: "pop" });
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
    items: [
      {
        type: "textfield",
        title: "Key",
        name: "key",
        value: key,
      },
      {
        type: "textfield",
        title: "Content",
        name: "content",
        value: await blob.text(),
      },
    ],
  } satisfies cmdk.Form);
});

app.post("/delete/:key", async (c) => {
  const key = c.req.param("key");
  const resp = await fetchAPI(`/v1/blob/${encodeURIComponent(key)}`, {
    method: "DELETE",
    token: c.get("token"),
  });

  if (!resp.ok) {
    return resp;
  }

  if (c.req.query("reload")) {
    return c.json(
      { type: "reload" },
      {
        status: 200,
      }
    );
  }

  if (c.req.query("pop")) {
    return c.json(
      { type: "pop" },
      {
        status: 200,
      }
    );
  }

  return new Response(null, {
    status: 204,
  });
});

export default app;
