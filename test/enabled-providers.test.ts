import {
  ApiPath,
  DEFAULT_MODELS,
  DISABLED_API_PATHS,
  ENABLED_SERVICE_PROVIDERS,
  ServiceProvider,
  isEnabledServiceProvider,
} from "../app/constant";

describe("enabled providers", () => {
  test("only OpenAI, Google, Anthropic and DeepSeek are enabled", () => {
    expect([...ENABLED_SERVICE_PROVIDERS].sort()).toEqual(
      [
        ServiceProvider.Anthropic,
        ServiceProvider.DeepSeek,
        ServiceProvider.Google,
        ServiceProvider.OpenAI,
      ].sort(),
    );
  });

  test("isEnabledServiceProvider", () => {
    expect(isEnabledServiceProvider(ServiceProvider.Anthropic)).toBe(true);
    expect(isEnabledServiceProvider("OpenAI")).toBe(true);
    expect(isEnabledServiceProvider(ServiceProvider.Azure)).toBe(false);
    expect(isEnabledServiceProvider(ServiceProvider.Stability)).toBe(false);
    expect(isEnabledServiceProvider(ServiceProvider["302.AI"])).toBe(false);
    expect(isEnabledServiceProvider("")).toBe(false);
  });

  test("the built-in model list only contains enabled providers", () => {
    const providers = new Set(
      DEFAULT_MODELS.map((m) => m.provider.providerName as string),
    );
    expect([...providers].sort()).toEqual(
      [...ENABLED_SERVICE_PROVIDERS].sort(),
    );
  });

  test("every other provider's API route is disabled, and no enabled one is", () => {
    const enabledPaths = [
      ApiPath.OpenAI,
      ApiPath.Google,
      ApiPath.Anthropic,
      ApiPath.DeepSeek,
    ];
    for (const path of enabledPaths) {
      expect(DISABLED_API_PATHS).not.toContain(path);
    }

    // Cors and Artifacts are not providers
    const providerPaths = Object.values(ApiPath).filter(
      (path) => path !== ApiPath.Cors && path !== ApiPath.Artifacts,
    );
    for (const path of providerPaths) {
      expect(
        enabledPaths.includes(path) || DISABLED_API_PATHS.includes(path),
      ).toBe(true);
    }
  });
});
