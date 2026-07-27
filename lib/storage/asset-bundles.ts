import "server-only";

import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  SASProtocol,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

import { env } from "@/lib/config/env";

const credential = new StorageSharedKeyCredential(
  env.AZURE_STORAGE_ACCOUNT,
  env.AZURE_STORAGE_KEY,
);
const service = new BlobServiceClient(
  `https://${env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
  credential,
);
const container = service.getContainerClient(
  env.AZURE_ASSET_BUNDLE_CONTAINER,
);

export async function createAssetBundleDownload(
  storageKey: string,
  filename: string,
): Promise<{ url: string; expiresAt: Date }> {
  const blob = container.getBlockBlobClient(storageKey);
  if (!(await blob.exists())) {
    throw new Error("Asset bundle is not present in private storage.");
  }

  const now = Date.now();
  const expiresAt = new Date(now + 15 * 60 * 1000);
  const sas = generateBlobSASQueryParameters(
    {
      containerName: env.AZURE_ASSET_BUNDLE_CONTAINER,
      blobName: storageKey,
      permissions: BlobSASPermissions.parse("r"),
      protocol: SASProtocol.Https,
      startsOn: new Date(now - 60 * 1000),
      expiresOn: expiresAt,
      contentDisposition: `attachment; filename="${filename}"`,
      contentType: "application/zip",
    },
    credential,
  ).toString();

  return { url: `${blob.url}?${sas}`, expiresAt };
}
