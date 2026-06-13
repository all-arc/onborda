import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

describe("package export metadata", () => {
  it("publishes under the okido package name", () => {
    expect(packageJson.name).toBe("okido");
  });

  it("declares ESM package metadata for tree shaking", () => {
    expect(packageJson.type).toBe("module");
    expect(packageJson.sideEffects).toBe(false);
    expect(packageJson.module).toBe("./dist/index.js");
  });

  it("exposes subpath imports so consumers can avoid the full barrel", () => {
    expect(packageJson.exports).toMatchObject({
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
      },
      "./okido": {
        types: "./dist/Okido.d.ts",
        import: "./dist/Okido.js",
      },
      "./context": {
        types: "./dist/OkidoContext.d.ts",
        import: "./dist/OkidoContext.js",
      },
      "./types": {
        types: "./dist/types/index.d.ts",
        import: "./dist/types/index.js",
      },
      "./package.json": "./package.json",
    });
  });

  it("marks the public entrypoint as a client boundary for Next.js", () => {
    const sourceEntrypoint = readFileSync(join(root, "src/index.ts"), "utf8");
    expect(sourceEntrypoint.startsWith("\"use client\";")).toBe(true);
  });
});
