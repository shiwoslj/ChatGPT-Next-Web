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
export const CLAUDE_THINKING_MIN_MAX_TOKENS = {
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
