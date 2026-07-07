// Pluggable LLM layer. Pick a provider via LLM_PROVIDER; the default (ollama)
// is fully free and runs locally with no API key and no usage limits.
//
//   ollama   — free, local. Needs `ollama serve` + a pulled model. No key.
//   groq     — free tier. Fast. Needs a free GROQ_API_KEY.
//   gemini   — free tier. Needs a free GEMINI_API_KEY.
//   openai   — paid / OpenAI-compatible endpoints. Needs OPENAI_API_KEY.
//   anthropic— paid. Needs ANTHROPIC_API_KEY.
//
// All providers expose the same `complete(system, user, maxTokens)` call.

export type Provider = "ollama" | "groq" | "gemini" | "openai" | "anthropic";

export function llmProvider(): Provider {
  return (process.env.LLM_PROVIDER as Provider) || "ollama";
}

const DEFAULT_MODEL: Record<Provider, string> = {
  ollama: "qwen2.5:7b", // strongest small local model for Chinese output
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-2.0-flash",
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-5",
};

// The concrete model string, for storing alongside each summary.
export function llmModel(): string {
  return process.env.LLM_MODEL || DEFAULT_MODEL[llmProvider()];
}

function requireKey(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set (required for LLM_PROVIDER=${llmProvider()})`);
  return v;
}

// Free tiers rate-limit aggressively (tokens/requests per minute).
export class RateLimitError extends Error {
  retryAfterMs: number;
  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

// Parse "Please try again in 7.66s" (Groq style) or a Retry-After header.
function parseRetryMs(bodyText: string, headers: Headers): number {
  const header = headers.get("retry-after");
  if (header && Number(header) > 0) return Math.ceil(Number(header) * 1000);
  const m = bodyText.match(/try again in ([\d.]+)m?s/i);
  if (m) return Math.ceil(parseFloat(m[1]) * 1000);
  return 15_000; // sensible default for per-minute windows
}

async function throwForStatus(res: Response, label: string): Promise<never> {
  const text = await res.text();
  if (res.status === 429) {
    throw new RateLimitError(`${label} 429: ${text.slice(0, 300)}`, parseRetryMs(text, res.headers));
  }
  throw new Error(`${label} ${res.status}: ${text.slice(0, 300)}`);
}

async function ollama(system: string, user: string, maxTokens: number): Promise<string> {
  const host = process.env.OLLAMA_HOST || "http://localhost:11434";
  const res = await fetch(`${host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: llmModel(),
      stream: false,
      options: { num_predict: maxTokens },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) await throwForStatus(res, "Ollama");
  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content ?? "";
}

// OpenAI-compatible chat completions (Groq, OpenAI, and many local servers).
async function openAiCompatible(
  baseUrl: string,
  apiKey: string,
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: llmModel(),
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) await throwForStatus(res, "LLM");
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

async function gemini(system: string, user: string, maxTokens: number): Promise<string> {
  const key = requireKey("GEMINI_API_KEY");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${llmModel()}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });
  if (!res.ok) await throwForStatus(res, "Gemini");
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}

async function anthropic(system: string, user: string, maxTokens: number): Promise<string> {
  // Imported lazily so the (paid) SDK is never loaded for free providers.
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const anthropicClient = new Anthropic({ apiKey: requireKey("ANTHROPIC_API_KEY") });
  const msg = await anthropicClient.messages.create({
    model: llmModel(),
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return msg.content
    .filter((b): b is { type: "text"; text: string; citations: null } => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

export async function complete(system: string, user: string, maxTokens = 4000): Promise<string> {
  switch (llmProvider()) {
    case "ollama":
      return ollama(system, user, maxTokens);
    case "groq":
      return openAiCompatible(
        "https://api.groq.com/openai/v1",
        requireKey("GROQ_API_KEY"),
        system,
        user,
        maxTokens,
      );
    case "openai":
      return openAiCompatible(
        process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
        requireKey("OPENAI_API_KEY"),
        system,
        user,
        maxTokens,
      );
    case "gemini":
      return gemini(system, user, maxTokens);
    case "anthropic":
      return anthropic(system, user, maxTokens);
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${llmProvider()}`);
  }
}
