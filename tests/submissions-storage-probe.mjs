import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { build } from "esbuild";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";

// Exercise the real server-only integration without changing the live preview's
// config or ACL. This test-only bundle removes Next's build-time marker; the
// application source and its runtime access checks remain unmodified.
export async function probePrivateStorage(check) {
  const endpoint = process.env.AZURE_SAMPLE_BLOB_ENDPOINT;
  assert.ok(endpoint, "Local Azure emulator endpoint is required for storage denial probes.");
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(endpoint).hostname), "Storage probes require a loopback emulator.");
  const service = new BlobServiceClient(endpoint, new StorageSharedKeyCredential(process.env.AZURE_STORAGE_ACCOUNT, process.env.AZURE_STORAGE_KEY));
  const original = process.env.AZURE_SAMPLE_CONTAINER;
  const temporaryName = `sample-probe-${randomUUID()}`;
  const publicContainer = service.getContainerClient(temporaryName);
  const temporary = await mkdtemp(join(tmpdir(), "dirac-storage-test-"));
  let created = false;
  try {
    const built = await build({
      entryPoints: ["lib/submissions/storage.ts"], bundle: true, write: false, platform: "node", format: "cjs", logLevel: "silent", packages: "external",
      banner: { js: `module.paths.unshift(${JSON.stringify(join(process.cwd(), "node_modules"))});` },
      plugins: [{ name: "test-server-module", setup(plugin) {
        plugin.onResolve({ filter: /^server-only$/ }, () => ({ path: "server-only", namespace: "test-marker" }));
        plugin.onLoad({ filter: /.*/, namespace: "test-marker" }, () => ({ contents: "", loader: "js" }));
      } }],
    });
    const modulePath = join(temporary, "private-storage.cjs");
    await writeFile(modulePath, built.outputFiles[0].contents);
    const { privateSampleStorage } = createRequire(import.meta.url)(modulePath);
    process.env.AZURE_SAMPLE_CONTAINER = temporaryName;
    await assert.rejects(privateSampleStorage, (error) => error.statusCode === 404);
    check(true, "missing/inaccessible private container fails closed at the storage boundary");
    await publicContainer.create({ access: "blob" }); created = true;
    await assert.rejects(privateSampleStorage, (error) => error.status === 503 && /Private sample storage is unavailable/.test(error.message));
    check(true, "an anonymously readable container is rejected before issuing grants");
    delete process.env.AZURE_SAMPLE_CONTAINER;
    await assert.rejects(privateSampleStorage, (error) => error.status === 503);
    check(true, "missing sample-container configuration cannot issue storage grants");
  } finally {
    if (original === undefined) delete process.env.AZURE_SAMPLE_CONTAINER; else process.env.AZURE_SAMPLE_CONTAINER = original;
    if (created) await publicContainer.deleteIfExists();
    await rm(temporary, { recursive: true, force: true });
  }
}
