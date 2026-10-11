/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";
import { getServerSideConfig } from "../app/config/server";

describe("upstream analytics and promotion", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.GA_ID;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("Google Analytics is off unless the deployer sets GA_ID", () => {
    expect(getServerSideConfig().gaId).toBeUndefined();

    process.env.GA_ID = "G-MYOWNID";
    expect(getServerSideConfig().gaId).toBe("G-MYOWNID");
  });

  test("the app does not link to the upstream hosted service", () => {
    // tests run as ES modules, where __dirname does not exist
    const root = path.join(process.cwd(), "app");
    // the MCP market, which is off unless ENABLE_MCP is set, loads its
    // server list from there
    const allowed = ["components/mcp-market.tsx"];

    const sources = (fs.readdirSync(root, { recursive: true }) as string[])
      .filter((name) => /\.tsx?$/.test(name))
      .filter((name) => !allowed.includes(name));
    expect(sources.length).toBeGreaterThan(100);

    const offenders = sources.filter((name) =>
      /nextchat\.club|SAAS_CHAT/.test(
        fs.readFileSync(path.join(root, name), "utf-8"),
      ),
    );
    expect(offenders).toEqual([]);
  });
});
