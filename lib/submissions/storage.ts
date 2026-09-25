import "server-only";
import { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters, SASProtocol, StorageSharedKeyCredential } from "@azure/storage-blob";
import { getSampleConfig } from "./config";
import { SampleError } from "./errors";
import type { SampleAttachment } from "@/lib/db/schema";

export async function privateSampleStorage() {
  const config = getSampleConfig();
  if (!config) throw new SampleError(503, "Sample uploads are unavailable. Please book a call or email founders@diracrobotics.com.");
  const credential = new StorageSharedKeyCredential(config.AZURE_STORAGE_ACCOUNT, config.AZURE_STORAGE_KEY);
  const endpoint = config.AZURE_SAMPLE_BLOB_ENDPOINT ?? `https://${config.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`;
  const service = new BlobServiceClient(endpoint, credential, { retryOptions: { maxTries: 2, tryTimeoutInMs: 10000 } });
  const container = service.getContainerClient(config.AZURE_SAMPLE_CONTAINER);
  // Never create a container or change its ACL automatically. Fail closed on
  // unavailable or anonymously readable storage, even if correctly named.
  const acl = await container.getAccessPolicy({ abortSignal: AbortSignal.timeout(10000) });
  if (acl.blobPublicAccess) throw new SampleError(503, "Private sample storage is unavailable. Please book a call.");
  function signedUrl(key: string, permissions: string, minutes: number, disposition?: string) {
    const sas = generateBlobSASQueryParameters({
      containerName: config!.AZURE_SAMPLE_CONTAINER, blobName: key,
      permissions: BlobSASPermissions.parse(permissions), startsOn: new Date(Date.now() - 60_000),
      expiresOn: new Date(Date.now() + minutes * 60_000),
      protocol: config!.AZURE_SAMPLE_BLOB_ENDPOINT ? SASProtocol.HttpsAndHttp : SASProtocol.Https,
      contentDisposition: disposition,
    }, credential).toString();
    return `${container.getBlockBlobClient(key).url}?${sas}`;
  }
  async function validBlob(key: string, attachment: SampleAttachment) {
    try {
      const info = await container.getBlockBlobClient(key).getProperties();
      return info.contentLength === attachment.sizeBytes && info.contentType === attachment.contentType && (!info.copyStatus || info.copyStatus === "success");
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) return false;
      throw error;
    }
  }
  return {
    uploadUrl: (key: string) => signedUrl(key, "cw", 20),
    validBlob,
    async finalize(attachment: SampleAttachment) {
      const final = container.getBlockBlobClient(attachment.storageKey);
      if (!(await validBlob(attachment.storageKey, attachment))) {
        if (!(await validBlob(attachment.stagingKey, attachment))) throw new SampleError(409, `Upload incomplete for ${attachment.originalFilename}. Retry the upload.`);
        const stage = container.getBlockBlobClient(attachment.stagingKey);
        const properties = await stage.getProperties();
        // A interrupted/invalid server copy is recoverable on the next retry.
        // This key is request-owned and cannot be written by an upload SAS.
        await final.deleteIfExists({ deleteSnapshots: "include" });
        // Copy to a different server-owned key. The visitor's upload capability
        // can never overwrite a committed file. ETag binds the checked source.
        const copy = await final.beginCopyFromURL(signedUrl(attachment.stagingKey, "r", 5), {
          sourceConditions: { ifMatch: properties.etag }, abortSignal: AbortSignal.timeout(45000),
          conditions: { ifNoneMatch: "*" }, intervalInMs: 500,
        });
        await copy.pollUntilDone();
        if (!(await validBlob(attachment.storageKey, attachment))) throw new SampleError(409, "The storage copy is incomplete. Retry to finish this request.");
      }
      // Keep the tracked staging key until the upload capability expires.
      // Its later cleanup is safe even if a client recreates it using old SAS.
    },
    async remove(attachment: SampleAttachment) {
      for (const key of [attachment.stagingKey, attachment.storageKey]) {
        if (!key.startsWith(`samples/${attachment.requestId}/`)) throw new SampleError(409, "Unexpected file location. Request retained for manual review.");
        await container.getBlockBlobClient(key).deleteIfExists({ deleteSnapshots: "include" });
      }
    },
    downloadUrl(attachment: SampleAttachment, preview = false) {
      const name = encodeURIComponent(attachment.originalFilename);
      return signedUrl(attachment.storageKey, "r", 5, `${preview && attachment.contentType.startsWith("video/") ? "inline" : "attachment"}; filename*=UTF-8''${name}`);
    },
    async cleanupStaging(attachment: SampleAttachment) {
      await container.getBlockBlobClient(attachment.stagingKey).deleteIfExists({ deleteSnapshots: "include" });
    },
  };
}
