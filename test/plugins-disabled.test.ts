import builtinPlugins from "../public/plugins.json";
import { PLUGINS_ENABLED } from "../app/constant";
import { usePluginStore } from "../app/store/plugin";

const OPENAPI = `
openapi: 3.0.0
info:
  title: Echo
  version: 1.0.0
servers:
  - url: https://example.com
paths:
  /echo:
    get:
      operationId: echo
      responses:
        "200":
          description: ok
`;

describe("plugins", () => {
  test("are switched off in this fork", () => {
    expect(PLUGINS_ENABLED).toBe(false);
  });

  test("no built-in plugin schemas are fetched", () => {
    expect(builtinPlugins).toEqual([]);
  });

  test("a stored plugin contributes no tools to requests", () => {
    const plugin = usePluginStore
      .getState()
      .create({ title: "Echo", content: OPENAPI });

    expect(usePluginStore.getState().get(plugin.id)).toBeTruthy();
    expect(usePluginStore.getState().getAsTools([plugin.id])).toEqual([[], {}]);
  });
});
