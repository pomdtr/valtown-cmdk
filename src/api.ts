/* Open in Val Town: https://www.val.town/v/pomdtr/fetchAPI */

export const API_URL =
  Deno.env.get("VALTOWN_API_URL") || "https://api.val.town";

export async function fetchAPI(
  path: string,
  options?: RequestInit & {
    paginate?: boolean;
    token?: string;
  }
): Promise<Response> {
  const auth = options?.token ? `Bearer ${options.token}` : undefined;
  const headers = auth
    ? { ...options?.headers, Authorization: auth }
    : options?.headers;

  if (options?.paginate) {
    const data = [];
    let url = new URL(`${API_URL}${path}`);
    url.searchParams.set("limit", "100");

    while (true) {
      const resp = await fetch(url, {
        headers,
      });
      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      const res = await resp.json();
      data.push(...res.data);

      if (!res.links.next) {
        break;
      }

      url = new URL(res.links.next);
    }

    return new Response(JSON.stringify({ data }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
}
