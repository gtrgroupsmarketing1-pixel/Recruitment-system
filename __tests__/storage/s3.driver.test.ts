import { describe, it, expect, vi, beforeEach } from "vitest";

const send = vi.fn();
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = send;
  },
  PutObjectCommand: class {
    constructor(public input: unknown) {}
  },
  GetObjectCommand: class {
    constructor(public input: unknown) {}
  },
  HeadObjectCommand: class {
    constructor(public input: unknown) {}
  },
  DeleteObjectCommand: class {
    constructor(public input: unknown) {}
  },
  HeadBucketCommand: class {
    constructor(public input: unknown) {}
  },
}));
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async (_client: unknown, cmd: { input: { Key: string } }) => {
    return `https://example.invalid/${cmd.input.Key}?signed=1`;
  }),
}));

describe("s3 driver", () => {
  beforeEach(() => {
    send.mockReset();
    process.env.S3_BUCKET = "vault";
    process.env.STORAGE_SSE = "AES256";
    process.env.S3_ACCESS_KEY_ID = "k";
    process.env.S3_SECRET_ACCESS_KEY = "s";
  });

  it("upload URL contains the key and SSE params", async () => {
    const { s3Driver, sseParams, resetS3Client } = await import(
      "@/core/storage/s3.driver"
    );
    resetS3Client();
    const url = await s3Driver.getSignedUploadUrl("tenants/t/a.pdf", "application/pdf", 60);
    expect(url).toContain("tenants/t/a.pdf");
    expect(sseParams()).toEqual({ ServerSideEncryption: "AES256" });
  });

  it("headObject returns null on NotFound", async () => {
    send.mockRejectedValueOnce(Object.assign(new Error("missing"), { name: "NotFound" }));
    const { s3Driver, resetS3Client } = await import("@/core/storage/s3.driver");
    resetS3Client();
    const head = await s3Driver.headObject("missing");
    expect(head).toBeNull();
  });

  it("headObject propagates other errors", async () => {
    send.mockRejectedValueOnce(Object.assign(new Error("boom"), { name: "AccessDenied" }));
    const { s3Driver, resetS3Client } = await import("@/core/storage/s3.driver");
    resetS3Client();
    await expect(s3Driver.headObject("x")).rejects.toThrow("boom");
  });
});
