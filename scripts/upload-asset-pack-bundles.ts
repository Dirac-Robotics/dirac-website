import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

const release = "0.1.0-beta.1";
const bundleFilenames = [
  "purple-chair-0.1.0-beta.1.zip",
  "table-0.1.0-beta.1.zip",
  "hammer-v2-0.1.0-beta.1.zip",
  "all-assets-0.1.0-beta.1.zip",
] as const;

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function sha256(filename: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filename)) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}

async function main() {
  const sourceDirectory = process.argv[2];
  if (!sourceDirectory) {
    throw new Error(
      "Usage: npm run asset-pack:upload -- /absolute/path/to/bundles",
    );
  }

  const resolvedSource = path.resolve(sourceDirectory);
  const account = requiredEnvironmentVariable("AZURE_STORAGE_ACCOUNT");
  const accountKey = requiredEnvironmentVariable("AZURE_STORAGE_KEY");
  const containerName =
    process.env.AZURE_ASSET_BUNDLE_CONTAINER?.trim() || "asset-bundles";

  const credential = new StorageSharedKeyCredential(account, accountKey);
  const service = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    credential,
  );
  const container = service.getContainerClient(containerName);

  await container.createIfNotExists();
  await container.setAccessPolicy();

  for (const filename of bundleFilenames) {
    const localPath = path.join(resolvedSource, filename);
    const fileStats = await stat(localPath);
    if (!fileStats.isFile()) {
      throw new Error(`Expected a regular file: ${localPath}`);
    }

    const digest = await sha256(localPath);
    const storageKey = `asset-pack/${release}/${filename}`;
    const blob = container.getBlockBlobClient(storageKey);

    process.stdout.write(
      `Uploading ${filename} (${fileStats.size} bytes) to ${containerName}/${storageKey}\n`,
    );
    await blob.uploadFile(localPath, {
      blobHTTPHeaders: {
        blobContentType: "application/zip",
        blobContentDisposition: `attachment; filename="${filename}"`,
        blobCacheControl: "private, no-store",
      },
      concurrency: 1,
      metadata: {
        release,
        sha256: digest,
      },
    });

    const properties = await blob.getProperties();
    if (properties.contentLength !== fileStats.size) {
      throw new Error(
        `Size verification failed for ${filename}: expected ${fileStats.size}, received ${properties.contentLength ?? "unknown"}`,
      );
    }

    process.stdout.write(`Verified ${filename}: sha256 ${digest}\n`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
