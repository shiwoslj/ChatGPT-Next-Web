import { jest } from "@jest/globals";
import { ClaudeApi } from "../app/client/platforms/anthropic";

// Runs one non-streaming chat call through ClaudeApi and returns the request it
// would put on the wire. The default config is temperature 0.5, top_p 1,
// max_tokens 4000.
async function sentRequest(model: string) {
  const fetchMock = global.fetch as jest.Mock;
  fetchMock.mockClear();

  await new ClaudeApi().chat({
    messages: [{ role: "user", content: "hi" }],
    config: { model, stream: false },
    onFinish: () => {},
    onError: () => {},
  });

  // the stores may fetch /api/config first, so pick the Anthropic call
  const call = fetchMock.mock.calls.find(([url]) =>
    String(url).includes("v1/messages"),
  );
  const init = call?.[1] as RequestInit;
  return {
    body: JSON.parse(init.body as string),
    headers: init.headers as Record<string, string>,
  };
}

describe("ClaudeApi request", () => {
  test("Claude 5: no sampling params, max_tokens raised for thinking", async () => {
    for (const model of ["claude-opus-5-5", "claude-fable-5-1"]) {
      const { body } = await sentRequest(model);
      expect(body.model).toBe(model);
      expect(body).not.toHaveProperty("temperature");
      expect(body).not.toHaveProperty("top_p");
      expect(body).not.toHaveProperty("top_k");
      expect(body.max_tokens).toBe(16000);
    }
  });

  test("Claude 4.7 / 4.8: no sampling params, max_tokens as configured", async () => {
    const { body } = await sentRequest("claude-opus-4-8");
    expect(body).not.toHaveProperty("temperature");
    expect(body).not.toHaveProperty("top_p");
    expect(body).not.toHaveProperty("top_k");
    expect(body.max_tokens).toBe(4000);
  });

  test("Claude 4.5 / 4.6: temperature and top_k, never top_p", async () => {
    const { body } = await sentRequest("claude-haiku-4-5");
    expect(body.temperature).toBe(0.5);
    expect(body.top_k).toBe(5);
    expect(body).not.toHaveProperty("top_p");
    expect(body.max_tokens).toBe(4000);
  });

  test("unrecognised names keep every sampling param", async () => {
    const { body } = await sentRequest("claude-3-5-sonnet-20241022");
    expect(body.temperature).toBe(0.5);
    expect(body.top_p).toBe(1);
    expect(body.top_k).toBe(5);
  });
});

describe("ClaudeApi.extractMessage", () => {
  test("returns the text even when a thinking block comes first", () => {
    const res = {
      content: [
        { type: "thinking", thinking: "", signature: "sig" },
        { type: "text", text: "Hello" },
      ],
    };
    expect(new ClaudeApi().extractMessage(res)).toBe("Hello");
  });

  test("returns the text of a plain response", () => {
    expect(
      new ClaudeApi().extractMessage({
        content: [{ type: "text", text: "Hi" }],
      }),
    ).toBe("Hi");
  });
});

describe("ClaudeApi refusal fallback", () => {
  test("is requested for the models that accept it", async () => {
    const models = [
      "claude-fable-5-1",
      "claude-opus-5-5",
      "claude-opus-5",
      "claude-sonnet-5-5",
    ];
    for (const model of models) {
      const { body, headers } = await sentRequest(model);
      expect(body.fallbacks).toBe("default");
      expect(headers["anthropic-beta"]).toBe("server-side-fallback-2026-07-01");
    }
  });

  test("is left out for every other model", async () => {
    const models = ["claude-haiku-5-5", "claude-opus-4-8", "claude-haiku-4-5"];
    for (const model of models) {
      const { body, headers } = await sentRequest(model);
      expect(body).not.toHaveProperty("fallbacks");
      expect(headers).not.toHaveProperty("anthropic-beta");
    }
  });
});
