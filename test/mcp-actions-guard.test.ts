/**
 * @jest-environment node
 */
import * as actions from "../app/mcp/actions";

// Every export of app/mcp/actions.ts is a Server Action that can be called
// over HTTP without going through the UI.
const guarded = [
  "getClientsStatus",
  "getClientTools",
  "getAvailableClientsCount",
  "getAllTools",
  "initializeMcpSystem",
  "addMcpServer",
  "pauseMcpServer",
  "resumeMcpServer",
  "removeMcpServer",
  "restartAllClients",
  "executeMcpAction",
  "getMcpConfigFromFile",
] as const;

describe("MCP server actions", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.ENABLE_MCP;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("the guarded list covers every export except isMcpEnabled", () => {
    const exported = Object.keys(actions).filter(
      (name) => typeof (actions as any)[name] === "function",
    );
    expect(exported.sort()).toEqual([...guarded, "isMcpEnabled"].sort());
  });

  test.each(guarded)("%s is refused while MCP is off", async (name) => {
    await expect((actions as any)[name]()).rejects.toThrow(
      "MCP is not enabled",
    );
  });

  test("isMcpEnabled still answers, and says no", async () => {
    await expect(actions.isMcpEnabled()).resolves.toBe(false);
  });

  test("actions run once ENABLE_MCP is set", async () => {
    process.env.ENABLE_MCP = "true";
    await expect(actions.isMcpEnabled()).resolves.toBe(true);
    await expect(actions.getAvailableClientsCount()).resolves.toBe(0);
  });
});
