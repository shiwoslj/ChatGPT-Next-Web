// Which request parameters a Claude model accepts depends on its generation,
// and every generation so far has accepted fewer. The rules are keyed on the
// version parsed from the model ID rather than on a list of names, so a model
// released after this was written gets the newest rules instead of the oldest.

export interface ClaudeModelTraits {
  temperature: boolean;
  top_p: boolean;
  top_k: boolean;
  // thinking runs unless it is turned off, and counts against max_tokens
  thinksByDefault: boolean;
}

// max_tokens floor for models that think by default, so there is room for the
// thinking and the answer. Non-streaming requests stay lower to finish within
// HTTP timeouts.
const CLAUDE_THINKING_MIN_MAX_TOKENS = {
  stream: 64000,
  nonStream: 16000,
};

// claude-<family>-<major>[-<minor>], e.g. claude-opus-5-5 or claude-sonnet-5.
// The minor is 1–2 digits so that a snapshot date (claude-opus-4-20250514) is
// not read as one.
const CLAUDE_VERSION_REGEX =
  /claude-(?:haiku|sonnet|opus|fable|mythos)-(\d{1,2})(?:-(\d{1,2}))?(?:-|$)/i;

export function getClaudeModelTraits(model: string): ClaudeModelTraits {
  const match = CLAUDE_VERSION_REGEX.exec(model);
  const major = match ? parseInt(match[1], 10) : 0;
  const minor = match?.[2] ? parseInt(match[2], 10) : 0;

  // 4.7 onwards rejects temperature, top_p and top_k
  if (major >= 5 || (major === 4 && minor >= 7)) {
    return {
      temperature: false,
      top_p: false,
      top_k: false,
      thinksByDefault: major >= 5,
    };
  }

  // 4.5 and 4.6 reject temperature and top_p sent together
  if (major === 4 && (minor === 5 || minor === 6)) {
    return {
      temperature: true,
      top_p: false,
      top_k: true,
      thinksByDefault: false,
    };
  }

  return {
    temperature: true,
    top_p: true,
    top_k: true,
    thinksByDefault: false,
  };
}

// max_tokens caps thinking plus the answer, so on models that think by default
// the UI default (4000) would cut replies short. A higher setting is kept.
export function getClaudeMaxTokens(
  model: string,
  configured: number,
  stream: boolean,
) {
  if (!getClaudeModelTraits(model).thinksByDefault) return configured;

  return Math.max(
    configured,
    stream
      ? CLAUDE_THINKING_MIN_MAX_TOKENS.stream
      : CLAUDE_THINKING_MIN_MAX_TOKENS.nonStream,
  );
}

// Server-side refusal fallback: when a model's safety classifiers decline a
// request, the API re-runs it on a fallback model within the same call.
// `fallbacks: "default"` lets Anthropic pick that model, and needs this beta
// header. Only the models listed accept it; the rest return the refusal.
export const CLAUDE_FALLBACK_BETA = "server-side-fallback-2026-07-01";

const CLAUDE_DEFAULT_FALLBACK_MODELS = [
  "claude-fable-5-1",
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-sonnet-5-5",
];

export function supportsClaudeDefaultFallback(model: string) {
  return CLAUDE_DEFAULT_FALLBACK_MODELS.includes(model.toLowerCase());
}

// The model that answered, when this stream event shows a fallback model took
// over from the requested one: for the whole turn (message_start names it) or
// from this block on (a "fallback" block). Undefined otherwise.
export function getClaudeFallbackModel(
  event: any,
  requestedModel: string,
): string | undefined {
  if (
    event?.type === "content_block_start" &&
    event.content_block?.type === "fallback"
  ) {
    const to = event.content_block.to?.model;
    return typeof to === "string" ? to : undefined;
  }

  if (event?.type === "message_start") {
    const servedBy = event.message?.model;
    // a snapshot ID of the requested model is still the requested model
    if (typeof servedBy === "string" && !servedBy.startsWith(requestedModel)) {
      return servedBy;
    }
  }

  return undefined;
}
