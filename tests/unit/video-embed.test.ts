import { describe, expect, it } from "vitest";
import { buildVideoEmbedUrl } from "../../src/lib/video-embed";

const YT_ID = "dQw4w9WgXcQ";
const BUNNY_VIDEO = "00000000-0000-0000-0000-000000000000";
const BUNNY_LIBRARY = "12345";

describe("buildVideoEmbedUrl", () => {
  it("lesson só com youtubeVideoId → provider youtube via nocookie", () => {
    const res = buildVideoEmbedUrl({ youtubeVideoId: YT_ID });
    expect(res).not.toBeNull();
    expect(res?.provider).toBe("youtube");
    expect(res?.src.startsWith("https://www.youtube-nocookie.com/embed/")).toBe(true);
  });

  it("lesson só com bunny* (ambos os campos presentes) → provider bunny via mediadelivery", () => {
    const res = buildVideoEmbedUrl({
      bunnyVideoId: BUNNY_VIDEO,
      bunnyLibraryId: BUNNY_LIBRARY,
    });
    expect(res).not.toBeNull();
    expect(res?.provider).toBe("bunny");
    expect(res?.src.startsWith("https://iframe.mediadelivery.net/embed/")).toBe(true);
  });

  it("lesson com ambos os providers → YouTube prioriza (caminho de migração)", () => {
    const res = buildVideoEmbedUrl({
      youtubeVideoId: YT_ID,
      bunnyVideoId: BUNNY_VIDEO,
      bunnyLibraryId: BUNNY_LIBRARY,
    });
    expect(res?.provider).toBe("youtube");
  });

  it("lesson sem nenhum vídeo → null", () => {
    expect(buildVideoEmbedUrl({})).toBeNull();
    expect(
      buildVideoEmbedUrl({
        youtubeVideoId: null,
        bunnyVideoId: null,
        bunnyLibraryId: null,
      }),
    ).toBeNull();
  });

  it("lesson com bunnyVideoId mas sem bunnyLibraryId → null (par incompleto)", () => {
    expect(buildVideoEmbedUrl({ bunnyVideoId: BUNNY_VIDEO })).toBeNull();
  });

  it("lesson com bunnyLibraryId mas sem bunnyVideoId → null (par incompleto)", () => {
    expect(buildVideoEmbedUrl({ bunnyLibraryId: BUNNY_LIBRARY })).toBeNull();
  });
});
