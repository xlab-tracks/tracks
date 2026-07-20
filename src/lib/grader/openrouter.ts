// Server-only OpenRouter chat client for the grader. Plain fetch (Workers
// compatible, no SDK). hy3 is a reasoning model: it spends completion
// tokens thinking before answering, so the budget is generous and only
// `message.content` (never `message.reasoning`) is returned.

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MAX_TOKENS = 6000;

export type GraderCallResult =
  | { ok: true; content: string }
  | { ok: false; error: string };

export async function callGrader(
  model: string,
  system: string,
  user: string,
  apiKey: string,
): Promise<GraderCallResult> {
  if (!apiKey) {
    return { ok: false, error: "Grading is not configured on this server." };
  }

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
  } catch {
    return { ok: false, error: "Could not reach the grading service." };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: `Grading service error (${response.status}).`,
    };
  }

  const data = (await response.json()) as {
    choices?: Array<{
      finish_reason?: string;
      message?: { content?: string | null };
    }>;
  };
  const choice = data.choices?.[0];
  const content = choice?.message?.content;
  if (!content) {
    return {
      ok: false,
      error:
        choice?.finish_reason === "length"
          ? "The grader ran out of tokens before finishing. Try again."
          : "The grader returned an empty response. Try again.",
    };
  }
  return { ok: true, content };
}
