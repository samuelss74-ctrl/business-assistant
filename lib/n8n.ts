const BASE_URL = process.env.N8N_BASE_URL;
const SHARED_SECRET = process.env.N8N_SHARED_SECRET;

/** Calls an n8n webhook path (e.g. "chat-router") with a shared secret header for the pilot's single-user auth. */
export async function callN8n<T>(path: string, body: unknown): Promise<T> {
  if (!BASE_URL || !SHARED_SECRET) {
    throw new Error("N8N_BASE_URL eller N8N_SHARED_SECRET saknas i miljövariablerna.");
  }
  const res = await fetch(`${BASE_URL}/webhook/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shared-Secret": SHARED_SECRET,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`n8n (${path}) svarade ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}
