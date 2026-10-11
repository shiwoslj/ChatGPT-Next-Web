import {
  getClaudeFallbackModel,
  getClaudeMaxTokens,
  getClaudeModelTraits,
  supportsClaudeDefaultFallback,
} from "../app/utils/anthropic";

describe("getClaudeModelTraits", () => {
  test("Claude 5 family takes no sampling params and thinks by default", () => {
    const models = [
      "claude-fable-5-1",
      "claude-fable-5",
      "claude-opus-5-5",
      "claude-opus-5",
      "claude-sonnet-5-5",
      "claude-sonnet-5",
      "claude-haiku-5-5",
    ];
    for (const model of models) {
      expect(getClaudeModelTraits(model)).toEqual({
        temperature: false,
        top_p: false,
        top_k: false,
        thinksByDefault: true,
      });
    }
  });

  test("Claude 4.7 and 4.8 take no sampling params but do not think by default", () => {
    for (const model of ["claude-opus-4-7", "claude-opus-4-8"]) {
      expect(getClaudeModelTraits(model)).toEqual({
        temperature: false,
        top_p: false,
        top_k: false,
        thinksByDefault: false,
      });
    }
  });

  test("Claude 4.5 and 4.6 take temperature and top_k but not top_p", () => {
    const models = [
      "claude-sonnet-4-5",
      "claude-haiku-4-5",
      "claude-opus-4-5",
      "claude-sonnet-4-6",
      "claude-opus-4-6",
    ];
    for (const model of models) {
      expect(getClaudeModelTraits(model)).toEqual({
        temperature: true,
        top_p: false,
        top_k: true,
        thinksByDefault: false,
      });
    }
  });

  test("a date suffix is not read as a minor version", () => {
    // 4.5 with a snapshot date stays 4.5
    expect(getClaudeModelTraits("claude-sonnet-4-5-20250929").top_p).toBe(
      false,
    );
    expect(getClaudeModelTraits("claude-opus-4-5-20251101").top_k).toBe(true);
    // 4.0 with a snapshot date is not "4.20250514"
    expect(getClaudeModelTraits("claude-opus-4-20250514")).toEqual({
      temperature: true,
      top_p: true,
      top_k: true,
      thinksByDefault: false,
    });
  });

  test("future majors default to the newest rules", () => {
    expect(getClaudeModelTraits("claude-opus-6")).toEqual({
      temperature: false,
      top_p: false,
      top_k: false,
      thinksByDefault: true,
    });
  });

  test("unrecognised names keep every sampling param", () => {
    const models = ["claude-3-5-sonnet-20241022", "claude-2.1", "my-proxy"];
    for (const model of models) {
      expect(getClaudeModelTraits(model)).toEqual({
        temperature: true,
        top_p: true,
        top_k: true,
        thinksByDefault: false,
      });
    }
  });

  test("is case-insensitive", () => {
    expect(getClaudeModelTraits("Claude-Opus-5-5").thinksByDefault).toBe(true);
  });
});

describe("getClaudeMaxTokens", () => {
  test("raises the limit for models that think by default", () => {
    expect(getClaudeMaxTokens("claude-opus-5-5", 4000, true)).toBe(64000);
    expect(getClaudeMaxTokens("claude-opus-5-5", 4000, false)).toBe(16000);
    expect(getClaudeMaxTokens("claude-haiku-5-5", 4000, true)).toBe(64000);
  });

  test("keeps a higher configured limit", () => {
    expect(getClaudeMaxTokens("claude-fable-5-1", 100000, true)).toBe(100000);
    expect(getClaudeMaxTokens("claude-fable-5-1", 32000, false)).toBe(32000);
  });

  test("leaves other models at the configured limit", () => {
    expect(getClaudeMaxTokens("claude-opus-4-8", 4000, true)).toBe(4000);
    expect(getClaudeMaxTokens("claude-haiku-4-5", 4000, true)).toBe(4000);
    expect(getClaudeMaxTokens("my-proxy", 4000, false)).toBe(4000);
  });
});

describe("supportsClaudeDefaultFallback", () => {
  test("is limited to the models that accept fallbacks: default", () => {
    const supported = [
      "claude-fable-5-1",
      "claude-opus-5-5",
      "claude-opus-5",
      "claude-sonnet-5-5",
    ];
    for (const model of supported) {
      expect(supportsClaudeDefaultFallback(model)).toBe(true);
    }

    const unsupported = [
      "claude-haiku-5-5",
      "claude-fable-5",
      "claude-sonnet-5",
      "claude-opus-4-8",
      "claude-opus-5-5-custom",
      "gpt-5",
    ];
    for (const model of unsupported) {
      expect(supportsClaudeDefaultFallback(model)).toBe(false);
    }
  });
});

describe("getClaudeFallbackModel", () => {
  const requested = "claude-opus-5-5";

  test("reads the model from a fallback block", () => {
    const event = {
      type: "content_block_start",
      index: 0,
      content_block: {
        type: "fallback",
        from: { model: "claude-opus-5-5" },
        to: { model: "claude-opus-4-8" },
      },
    };
    expect(getClaudeFallbackModel(event, requested)).toBe("claude-opus-4-8");
    // an explicit fallback block counts even when the IDs share a prefix
    expect(getClaudeFallbackModel(event, "claude-opus-5")).toBe(
      "claude-opus-4-8",
    );
    expect(
      getClaudeFallbackModel(
        {
          type: "content_block_start",
          content_block: {
            type: "fallback",
            from: { model: "claude-opus-5" },
            to: { model: "claude-opus-5-5" },
          },
        },
        "claude-opus-5",
      ),
    ).toBe("claude-opus-5-5");
  });

  test("reads the model from message_start when the turn was served by a fallback", () => {
    const event = {
      type: "message_start",
      message: { model: "claude-opus-4-8" },
    };
    expect(getClaudeFallbackModel(event, requested)).toBe("claude-opus-4-8");
  });

  test("is undefined when the requested model answered", () => {
    expect(
      getClaudeFallbackModel(
        { type: "message_start", message: { model: "claude-opus-5-5" } },
        requested,
      ),
    ).toBeUndefined();
    // a snapshot ID of the requested model
    expect(
      getClaudeFallbackModel(
        {
          type: "message_start",
          message: { model: "claude-opus-5-5-20260922" },
        },
        requested,
      ),
    ).toBeUndefined();
  });

  test("ignores other events", () => {
    const events = [
      { type: "content_block_start", content_block: { type: "text" } },
      { type: "content_block_delta", delta: { type: "text_delta", text: "x" } },
      { type: "message_delta", delta: { stop_reason: "end_turn" } },
      { type: "ping" },
      undefined,
    ];
    for (const event of events) {
      expect(getClaudeFallbackModel(event, requested)).toBeUndefined();
    }
  });
});
