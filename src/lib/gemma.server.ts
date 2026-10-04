// Server-only Gemma 4 client (Gemini API). The key never reaches the browser.
const BASE = "https://generativelanguage.googleapis.com/v1beta";
let cachedModel: string | undefined;

function getKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured on the server.");
  return key;
}

function sizeScore(name: string) {
  const m = name.match(/(\d+)b/i);
  const n = m ? Number(m[1]) : 0;
  return /-e\d+b/i.test(name) ? n / 10 : n; // effective-param "e" models rank lower
}

export async function resolveGemmaModel(): Promise<string> {
  if (process.env.GEMMA_MODEL) return process.env.GEMMA_MODEL;
  if (cachedModel) return cachedModel;
  const res = await fetch(`${BASE}/models?pageSize=1000`, { headers: { "x-goog-api-key": getKey() } });
  if (!res.ok) throw new Error(`Gemini API model listing failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
  const names = (json.models ?? [])
    .filter((m) => m.name.includes("gemma-4") && m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => m.name.replace(/^models\//, ""))
    .sort((a, b) => sizeScore(b) - sizeScore(a));
  if (!names.length) throw new Error("No Gemma 4 model is available for this Gemini API key.");
  cachedModel = names[0];
  return cachedModel;
}

export type Turn = { role: "user" | "model"; text: string };

export async function callGemma(turns: Turn[], temperature = 0.7): Promise<{ text: string; model: string }> {
  const model = await resolveGemmaModel();
  const res = await fetch(`${BASE}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": getKey() },
    body: JSON.stringify({
      contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
      generationConfig: { temperature },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("Gemma 4 is rate limited right now. Please wait a moment and try again.");
    throw new Error(`Gemma 4 request failed (${res.status}): ${body.slice(0, 240)}`);
  }
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  };
  const text = (json.candidates?.[0]?.content?.parts ?? [])
    .filter((p) => !p.thought && p.text)
    .map((p) => p.text)
    .join("")
    .trim();
  if (!text) throw new Error("Gemma 4 returned an empty response.");
  return { text, model };
}

export function extractJson<T>(text: string): T {
  const cleaned = text.replace(/```(?:json)?/gi, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("No JSON object in Gemma output");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

export async function callGemmaJson<T>(prompt: string): Promise<{ data: T; model: string }> {
  let lastErr: unknown;
  for (let i = 0; i < 2; i++) {
    const { text, model } = await callGemma([{ role: "user", text: prompt }], i === 0 ? 0.7 : 0.4);
    try {
      return { data: extractJson<T>(text), model };
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`Gemma 4 returned malformed JSON: ${String(lastErr)}`);
}
