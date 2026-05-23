/**
 * YouTube embed helpers — parte da fricção contra cópia casual do ADR-016.
 *
 * Atenção operacional: este módulo NÃO oferece proteção contra download. Embed
 * com modestbranding/rel=0/disablekb apenas reduz UI do YouTube e atalhos no
 * player. O vídeo segue baixável via yt-dlp ou extensões; é trade-off aceito
 * em ADR-016 em paralelo ao ADR-015 (recovery email+CPF compartilhável).
 *
 * Usamos `youtube-nocookie.com` em vez de `youtube.com` por motivo LGPD: o
 * domínio nocookie só grava cookies de tracking após a interação real do
 * usuário, evitando registro pré-consentimento.
 */

const YOUTUBE_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

const URL_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

function isValidId(candidate: string): boolean {
  return YOUTUBE_ID_REGEX.test(candidate);
}

function tryExtractFromUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (!URL_HOSTS.has(url.host)) return null;

  if (url.host === "youtu.be") {
    const id = url.pathname.replace(/^\/+/, "").split("/")[0] ?? "";
    return isValidId(id) ? id : null;
  }

  if (url.pathname === "/watch") {
    const id = url.searchParams.get("v") ?? "";
    return isValidId(id) ? id : null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length >= 2 && (segments[0] === "embed" || segments[0] === "shorts")) {
    const id = segments[1];
    return isValidId(id) ? id : null;
  }

  return null;
}

export function extractYoutubeId(input: string): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  if (isValidId(trimmed)) return trimmed;

  return tryExtractFromUrl(trimmed);
}

export function buildYoutubeEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    modestbranding: "1",
    rel: "0",
    iv_load_policy: "3",
    disablekb: "1",
    playsinline: "1",
    fs: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
