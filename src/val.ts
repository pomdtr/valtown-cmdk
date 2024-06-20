import { Hono } from "hono";
import type * as cmdk from "./cmdk.ts";
import { fetchAPI } from "./api.ts";
import type { Variables } from "./mod.ts";

const app = new Hono<{ Variables: Variables }>();

app.get("/vals", async (c) => {
  const username = c.req.query("user");
  let userID: string;
  if (username) {
    const resp = await fetchAPI(`/v1/alias/${username}`, {
      token: c.get("token"),
    });

    if (!resp.ok) {
      return resp;
    }

    const user = await resp.json();
    userID = user.id;
  } else {
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
      author: { username: string; id: string };
    }[];
  };

  return c.json({
    type: "list",
    icon: "https://pomdtr-favicon.web.val.run/val-town",

    title: "Vals | Val Town",
    isShowingDetail: true,
    items: vals.map(
      (val) =>
        ({
          title: `${val.author.username}/${val.name}`,
          icon: "https://api.iconify.design/codicon/code.svg",
          detail: {
            markdown: ["```tsx", val.code, "```"].join("\n"),
            metadata: [
              { type: "label", title: "ID", text: val.id },
              {
                type: "link",
                url: `https://www.val.town/v/${val.author.username}/${val.name}`,
                text: `@${val.author.username}/${val.name}`,
                title: "Link",
              },
            ],
          },
          actions: [
            {
              title: "Open Val URL",
              icon: "https://api.iconify.design/codicon/globe.svg",
              onAction: {
                type: "open",
                url: `https://www.val.town/v/${val.author.username}/${val.name}`,
              },
            },
            {
              title: "Copy Val ID",
              icon: "https://api.iconify.design/codicon/clippy.svg",
              onAction: {
                type: "copy",
                text: val.id,
              },
            },
            {
              title: "View User",
              icon: "https://api.iconify.design/codicon/person.svg",
              onAction: {
                type: "push",
                page: `/user/${val.author.id}`,
              },
            },
            {
              title: "View Readme",
              icon: "https://api.iconify.design/codicon/arrow-right.svg",
              onAction: {
                type: "push",
                page: `/val/readme/${val.id}`,
              },
            },
            {
              title: "Delete",
              icon: "https://api.iconify.design/codicon/trash.svg",
              onAction: {
                type: "run",
                command: `/val/delete/${val.id}`,
                onSuccess: "reload",
              },
            },
          ],
        } satisfies cmdk.ListItem)
    ),
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
    icon: "https://pomdtr-favicon.web.val.run/val-town",

    title: `${val.author.username}/${val.name} Readme`,
    actions: [
      {
        title: "Copy Val Readme",
        onAction: {
          type: "copy",
          text: val.readme,
        },
      },
    ],
    markdown: val.readme,
  } satisfies cmdk.Detail);
});

app.all("/val/:id/edit", async (c) => {
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
        page: `/val/view/${valID}`,
      } satisfies cmdk.PushAction,
      {
        status: 200,
      }
    );
  }

  return c.json({
    type: "form",
    icon: "https://pomdtr-favicon.web.val.run/val-town",
    title: "Edit Val | Val Town",
    onSubmit: {
      type: "run",
    },
    items: [
      {
        name: "name",
        title: "Name",
        required: true,
        type: "textfield",
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
        type: "dropdown",
        value: "private",
        items: [
          { value: "private", title: "Private" },
          { value: "unlisted", title: "Unlisted" },
          { value: "public", title: "Public" },
        ],
      },
      {
        name: "type",
        title: "Type",
        required: true,
        type: "dropdown",
        value: "http",
        items: [
          { value: "http", title: "HTTP" },
          { value: "script", title: "Script" },
          { value: "email", title: "Email" },
        ],
      },
    ],
  } satisfies cmdk.Form);
});

app.all("/vals/new", async (c) => {
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
    icon: "https://pomdtr-favicon.web.val.run/val-town",
    title: "Create Val | Val Town",
    onSubmit: {
      type: "run",
    },
    items: [
      {
        name: "name",
        title: "Name",
        required: true,
        type: "textfield",
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
        type: "dropdown",
        value: "private",
        items: [
          { value: "private", title: "Private" },
          { value: "unlisted", title: "Unlisted" },
          { value: "public", title: "Public" },
        ],
      },
      {
        name: "type",
        title: "Type",
        required: true,
        type: "dropdown",
        value: "http",
        items: [
          { value: "http", title: "HTTP" },
          { value: "script", title: "Script" },
          { value: "email", title: "Email" },
        ],
      },
    ],
  } satisfies cmdk.Form);
});

app.get("/v/:author/:name", async (c) => {
  const { author, name } = c.req.param();
  const resp = await fetchAPI(`/v1/alias/${author}/${name}`, {
    token: c.get("token"),
  });
  if (!resp.ok) {
    return resp;
  }
  const val = await resp.json();

  return c.redirect(`/val/${val.id}`);
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

  return new Response(null, {
    status: 204,
  });
});

export default app;
