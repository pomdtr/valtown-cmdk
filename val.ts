import { Hono } from "hono";
import * as cmdk from "./cmdk.ts";
import { fetchAPI } from "val-town-api";

const app = new Hono();

app.get("/list", async (c) => {
  let userID = c.req.query("user");
  if (!userID) {
    const resp = await fetchAPI("/v1/me", {
      token: c.get("token"),
    });

    if (!resp.ok) {
      return resp;
    }

    const me = await resp.json();
    userID = me.id;
  }
  const resp = await fetchAPI(`/v1/users/${userID}/vals`, {
    token: c.get("token"),
    paginate: true,
  });

  if (!resp.ok) {
    return resp;
  }

  const { data: vals } = (await resp.json()) as {
    data: {
      id: string;
      name: string;
      code: string;
      author: { username: string };
    }[];
  };

  return c.json({
    type: "list",
    isShowingDetail: true,
    items: vals.map((val) => ({
      title: `${val.author.username}/${val.name}`,
      icon: "https://api.iconify.design/codicon/code.svg",
      detail: {
        markdown: ["```tsx", val.code, "```"].join("\n"),
      },
      actions: [
        {
          title: "Open Val URL",
          icon: "https://api.iconify.design/codicon/globe.svg",
          type: "open",
          url: `https://www.val.town/v/${val.author.username}/${val.name}`,
        },
        {
          title: "Copy Val ID",
          icon: "https://api.iconify.design/codicon/clippy.svg",
          type: "copy",
          text: val.id,
        },
        {
          title: "View Readme",
          icon: "https://api.iconify.design/codicon/arrow-right.svg",
          type: "push",
          url: `/val/readme/${val.id}`,
        },
        {
          title: "Delete",
          icon: "https://api.iconify.design/codicon/trash.svg",
          type: "run",
          url: `/val/delete/${val.id}?reload=true`,
        },
      ],
    })),
  } satisfies cmdk.List);
});

app.get("/readme/:id", async (c) => {
  const valID = c.req.param("id");
  const resp = await fetchAPI(`/v1/vals/${valID}`, {
    token: c.get("token"),
  });

  if (!resp.ok) {
    return resp;
  }

  const val = await resp.json();
  return c.json({
    type: "detail",
    actions: [{ title: "Copy Val Readme", type: "copy", text: val.readme }],
    markdown: val.readme,
  });
});

app.all("/edit/:id", async (c) => {
  const valID = c.req.param("id");
  if (c.req.method == "POST") {
    const { name, code, privacy, type } = await c.req.json();

    await fetchAPI(`/v1/vals/${valID}`, {
      method: "PATCH",
      token: c.get("token"),
      body: JSON.stringify({ name, code, privacy, type }),
    });

    return c.json(
      {
        type: "push",
        url: `/val/view/${valID}`,
      },
      {
        status: 200,
      }
    );
  }

  return c.json({
    type: "form",
    title: "Edit Val",
    items: [
      {
        name: "name",
        title: "Name",
        required: true,
        type: "text",
      },
      {
        name: "code",
        title: "Code",
        required: true,
        type: "textarea",
      },
      {
        name: "privacy",
        title: "Privacy",
        required: true,
        type: "select",
        value: "private",
        options: [
          { value: "private", title: "Private" },
          { value: "unlisted", title: "Unlisted" },
          { value: "public", title: "Public" },
        ],
      },
      {
        name: "type",
        title: "Type",
        required: true,
        type: "select",
        value: "http",
        options: [
          { value: "http", title: "HTTP" },
          { value: "script", title: "Script" },
          { value: "email", title: "Email" },
        ],
      },
    ],
  });
});

app.all("/create", async (c) => {
  if (c.req.method == "POST") {
    const { name, code, privacy, type } = await c.req.json();

    const resp = await fetchAPI("/v1/vals", {
      method: "POST",
      token: c.get("token"),
      body: JSON.stringify({ name, code, privacy, type }),
    });

    if (!resp.ok) {
      return resp;
    }

    const val = await resp.json();
    return c.json(
      {
        type: "push",
        url: `/val/view`,
        data: {
          val: val.id,
        },
      },
      {
        status: 201,
      }
    );
  }

  return c.json({
    type: "form",
    title: "Create Val",
    items: [
      {
        name: "name",
        title: "Name",
        required: true,
        type: "text",
      },
      {
        name: "code",
        title: "Code",
        required: true,
        type: "textarea",
      },
      {
        name: "privacy",
        title: "Privacy",
        required: true,
        type: "select",
        defaultValue: "private",
        options: [
          { value: "private", title: "Private" },
          { value: "unlisted", title: "Unlisted" },
          { value: "public", title: "Public" },
        ],
      },
      {
        name: "type",
        title: "Type",
        required: true,
        type: "select",
        defaultValue: "http",
        options: [
          { value: "http", title: "HTTP" },
          { value: "script", title: "Script" },
          { value: "email", title: "Email" },
        ],
      },
    ],
  });
});

app.post("/delete/:id", async (c) => {
  const val = c.req.param("id");
  const resp = await fetchAPI(`/v1/vals/${val}`, {
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

  return new Response(null, {
    status: 204,
  });
});

export default app;
