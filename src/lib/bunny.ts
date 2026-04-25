import { createHash } from "node:crypto";

export type BunnyConfig = {
  apiKey: string;
  libraryId: string;
};

export class BunnyNotConfiguredError extends Error {
  constructor() {
    super(
      "Bunny Stream não configurado. Defina BUNNY_STREAM_API_KEY e BUNNY_STREAM_LIBRARY_ID no .env.",
    );
    this.name = "BunnyNotConfiguredError";
  }
}

function readConfig(): BunnyConfig | null {
  const apiKey = process.env.BUNNY_STREAM_API_KEY?.trim();
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID?.trim();
  if (!apiKey || !libraryId) return null;
  return { apiKey, libraryId };
}

export function isBunnyConfigured(): boolean {
  return readConfig() !== null;
}

const TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";

function apiBase(libraryId: string) {
  return `https://video.bunnycdn.com/library/${libraryId}`;
}

type CreateVideoResponse = {
  guid: string;
  title: string;
};

export type CreatedVideo = {
  videoId: string;
  libraryId: string;
  uploadUrl: string;
  authorizationSignature: string;
  authorizationExpire: number;
};

function computeTusSignature(
  apiKey: string,
  libraryId: string,
  videoId: string,
  expire: number,
): string {
  return createHash("sha256").update(`${libraryId}${apiKey}${expire}${videoId}`).digest("hex");
}

export async function createVideo(title: string): Promise<CreatedVideo> {
  const cfg = readConfig();
  if (!cfg) throw new BunnyNotConfiguredError();

  const res = await fetch(`${apiBase(cfg.libraryId)}/videos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      AccessKey: cfg.apiKey,
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bunny createVideo falhou (${res.status}): ${text}`);
  }

  const data = (await res.json()) as CreateVideoResponse;
  const expire = Math.floor(Date.now() / 1000) + 60 * 60;
  const authorizationSignature = computeTusSignature(cfg.apiKey, cfg.libraryId, data.guid, expire);

  return {
    videoId: data.guid,
    libraryId: cfg.libraryId,
    uploadUrl: TUS_ENDPOINT,
    authorizationSignature,
    authorizationExpire: expire,
  };
}

export type BunnyVideoStatus = {
  status: number;
  length: number;
  title: string;
};

export async function getVideoStatus(videoId: string): Promise<BunnyVideoStatus> {
  const cfg = readConfig();
  if (!cfg) throw new BunnyNotConfiguredError();

  const res = await fetch(`${apiBase(cfg.libraryId)}/videos/${videoId}`, {
    headers: { AccessKey: cfg.apiKey },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bunny getVideoStatus falhou (${res.status}): ${text}`);
  }
  return (await res.json()) as BunnyVideoStatus;
}

export async function deleteVideo(videoId: string): Promise<void> {
  const cfg = readConfig();
  if (!cfg) throw new BunnyNotConfiguredError();

  const res = await fetch(`${apiBase(cfg.libraryId)}/videos/${videoId}`, {
    method: "DELETE",
    headers: { AccessKey: cfg.apiKey },
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bunny deleteVideo falhou (${res.status}): ${text}`);
  }
}
