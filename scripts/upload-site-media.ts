import { stat } from "node:fs/promises";
import path from "node:path";

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

import { env } from "@/lib/config/env";

const MEDIA_DIR = path.resolve(process.cwd(), "public/media");
const CACHE_CONTROL = "public, max-age=31536000, immutable";

const FILES = [
  { filename: "dirac-launch.mp4", contentType: "video/mp4" },
  { filename: "dirac-launch-poster.webp", contentType: "image/webp" },
  { filename: "real2sim-comparison.webp", contentType: "image/webp" },
  { filename: "real2sim-scene-poster.webp", contentType: "image/webp" },
  { filename: "real2sim-scene.glb", contentType: "model/gltf-binary" },
] as const;

async function main() {
  const credential = new StorageSharedKeyCredential(
    env.AZURE_STORAGE_ACCOUNT,
    env.AZURE_STORAGE_KEY,
  );
  const service = new BlobServiceClient(
    `https://${env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
    credential,
  );
  const container = service.getContainerClient(env.AZURE_STORAGE_CONTAINER);

  for (const file of FILES) {
    const localPath = path.join(MEDIA_DIR, file.filename);
    const { size } = await stat(localPath);
    const blobName = `site/${file.filename}`;
    const blob = container.getBlockBlobClient(blobName);

    await blob.uploadFile(localPath, {
      blobHTTPHeaders: {
        blobContentType: file.contentType,
        blobCacheControl: CACHE_CONTROL,
      },
    });

    console.log(`${blob.url} (${size} bytes)`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
