import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
};

export class R2NotConfiguredError extends Error {
  constructor() {
    super("Cloudflare R2 não configurado. Defina R2_* no .env.");
    this.name = "R2NotConfiguredError";
  }
}

function readConfig(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return null;
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

export function isR2Configured(): boolean {
  return readConfig() !== null;
}

export function getR2Client(): S3Client {
  const cfg = readConfig();
  if (!cfg) throw new R2NotConfiguredError();

  return new S3Client({
    region: "auto",
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
}

export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 600,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const cfg = readConfig();
  if (!cfg) throw new R2NotConfiguredError();

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  const publicUrl = getPublicUrl(key);

  return { uploadUrl, publicUrl };
}

export function getPublicUrl(key: string): string {
  const cfg = readConfig();
  if (!cfg) throw new R2NotConfiguredError();
  const base = cfg.publicUrl.replace(/\/+$/, "");
  const cleanKey = key.replace(/^\/+/, "");
  return `${base}/${cleanKey}`;
}
