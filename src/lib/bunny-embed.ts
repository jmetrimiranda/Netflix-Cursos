const BUNNY_EMBED_BASE = "https://iframe.mediadelivery.net/embed";

export type BunnyEmbedOptions = {
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  preload?: boolean;
  responsive?: boolean;
};

const DEFAULT_OPTIONS: Required<BunnyEmbedOptions> = {
  autoplay: false,
  loop: false,
  muted: false,
  preload: true,
  responsive: true,
};

export function buildBunnyEmbedUrl(
  libraryId: string,
  videoId: string,
  options: BunnyEmbedOptions = {},
): string {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  const params = new URLSearchParams({
    autoplay: String(merged.autoplay),
    loop: String(merged.loop),
    muted: String(merged.muted),
    preload: String(merged.preload),
    responsive: String(merged.responsive),
  });
  return `${BUNNY_EMBED_BASE}/${libraryId}/${videoId}?${params.toString()}`;
}
