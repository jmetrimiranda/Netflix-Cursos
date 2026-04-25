import { buildBunnyEmbedUrl } from "@/lib/bunny-embed";
import { describe, expect, it } from "vitest";

describe("buildBunnyEmbedUrl", () => {
  it("uses Bunny mediadelivery domain with library and video ids", () => {
    const url = buildBunnyEmbedUrl("123", "abc-def");
    expect(url.startsWith("https://iframe.mediadelivery.net/embed/123/abc-def?")).toBe(true);
  });

  it("includes the default player params", () => {
    const url = new URL(buildBunnyEmbedUrl("lib", "vid"));
    expect(url.searchParams.get("autoplay")).toBe("false");
    expect(url.searchParams.get("loop")).toBe("false");
    expect(url.searchParams.get("muted")).toBe("false");
    expect(url.searchParams.get("preload")).toBe("true");
    expect(url.searchParams.get("responsive")).toBe("true");
  });

  it("respects overrides", () => {
    const url = new URL(buildBunnyEmbedUrl("lib", "vid", { autoplay: true, muted: true }));
    expect(url.searchParams.get("autoplay")).toBe("true");
    expect(url.searchParams.get("muted")).toBe("true");
    expect(url.searchParams.get("preload")).toBe("true");
  });
});
