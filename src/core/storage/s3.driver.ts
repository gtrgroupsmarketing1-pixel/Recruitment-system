import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ValidationError } from "@/lib/errors";
import type { StorageClient } from "./storage.types";

let client: S3Client | null = null;

function storageEnv() {
  return {
    region: process.env.S3_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    bucket: process.env.S3_BUCKET || "",
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    sse: process.env.STORAGE_SSE || "AES256",
    kmsKeyId: process.env.STORAGE_KMS_KEY_ID,
  };
}

export function getS3Client(): S3Client {
  if (client) return client;
  const env = storageEnv();
  client = new S3Client({
    region: env.region,
    endpoint: env.endpoint,
    forcePathStyle: env.forcePathStyle,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  });
  return client;
}

/** Test hook. */
export function resetS3Client(): void {
  client = null;
}

export function sseParams(): Record<string, string> {
  const env = storageEnv();
  if (env.sse === "aws:kms") {
    if (!env.kmsKeyId) throw new ValidationError("STORAGE_KMS_KEY_ID missing");
    return { ServerSideEncryption: "aws:kms", SSEKMSKeyId: env.kmsKeyId };
  }
  if (env.sse === "AES256") return { ServerSideEncryption: "AES256" };
  return {};
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name?: string }).name === "NotFound"
  );
}

export const s3Driver: StorageClient = {
  async getSignedUploadUrl(key, mimeType, expiresIn) {
    const env = storageEnv();
    const cmd = new PutObjectCommand({
      Bucket: env.bucket,
      Key: key,
      ContentType: mimeType,
      ...sseParams(),
    });
    return getSignedUrl(getS3Client(), cmd, { expiresIn });
  },

  async getSignedDownloadUrl(key, expiresIn) {
    const env = storageEnv();
    const cmd = new GetObjectCommand({ Bucket: env.bucket, Key: key });
    return getSignedUrl(getS3Client(), cmd, { expiresIn });
  },

  async headObject(key) {
    const env = storageEnv();
    try {
      const out = await getS3Client().send(
        new HeadObjectCommand({ Bucket: env.bucket, Key: key })
      );
      return { size: out.ContentLength ?? 0, contentType: out.ContentType ?? "" };
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  },

  async deleteObject(key) {
    const env = storageEnv();
    await getS3Client().send(
      new DeleteObjectCommand({ Bucket: env.bucket, Key: key })
    );
  },

  async writeObject(key, bytes, contentType) {
    const env = storageEnv();
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: env.bucket,
        Key: key,
        Body: bytes,
        ContentType: contentType,
        ...sseParams(),
      })
    );
  },

  async getObject(key) {
    const env = storageEnv();
    try {
      const out = await getS3Client().send(
        new GetObjectCommand({ Bucket: env.bucket, Key: key })
      );
      const body = out.Body;
      if (!body) return null;
      const bytes = await body.transformToByteArray();
      return Buffer.from(bytes);
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  },

  async headBucket() {
    const env = storageEnv();
    const start = Date.now();
    await getS3Client().send(new HeadBucketCommand({ Bucket: env.bucket }));
    return { ok: true, latencyMs: Date.now() - start };
  },
};
