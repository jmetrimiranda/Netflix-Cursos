import { describe, expect, it } from "vitest";
import { buildYoutubeEmbedUrl, extractYoutubeId } from "../../src/lib/youtube";

const VALID_ID = "dQw4w9WgXcQ";

describe("extractYoutubeId", () => {
  it("retorna o ID de uma URL youtube.com/watch padrão", () => {
    expect(extractYoutubeId(`https://www.youtube.com/watch?v=${VALID_ID}`)).toBe(VALID_ID);
  });

  it("retorna o ID de uma URL youtu.be curta", () => {
    expect(extractYoutubeId(`https://youtu.be/${VALID_ID}`)).toBe(VALID_ID);
  });

  it("ignora query params extras (utm_source, t=10s)", () => {
    expect(
      extractYoutubeId(`https://www.youtube.com/watch?v=${VALID_ID}&utm_source=newsletter&t=10s`),
    ).toBe(VALID_ID);
  });

  it("aceita trailing slash em youtu.be", () => {
    expect(extractYoutubeId(`https://youtu.be/${VALID_ID}/`)).toBe(VALID_ID);
  });

  it("extrai ID de URL /shorts/", () => {
    expect(extractYoutubeId(`https://www.youtube.com/shorts/${VALID_ID}`)).toBe(VALID_ID);
  });

  it("extrai ID de URL /embed/", () => {
    expect(extractYoutubeId(`https://www.youtube.com/embed/${VALID_ID}`)).toBe(VALID_ID);
  });

  it("aceita host mobile m.youtube.com", () => {
    expect(extractYoutubeId(`https://m.youtube.com/watch?v=${VALID_ID}`)).toBe(VALID_ID);
  });

  it("aceita host youtube.com sem www", () => {
    expect(extractYoutubeId(`https://youtube.com/watch?v=${VALID_ID}`)).toBe(VALID_ID);
  });

  it("aceita URL youtube-nocookie.com/embed/", () => {
    expect(extractYoutubeId(`https://www.youtube-nocookie.com/embed/${VALID_ID}`)).toBe(VALID_ID);
  });

  it("aceita ID puro de 11 chars no charset válido", () => {
    expect(extractYoutubeId(VALID_ID)).toBe(VALID_ID);
  });

  it("aceita ID com underscore e hífen", () => {
    expect(extractYoutubeId("aBcDeF_-789")).toBe("aBcDeF_-789");
  });

  it("trim do input antes de processar", () => {
    expect(extractYoutubeId(`   ${VALID_ID}   `)).toBe(VALID_ID);
  });

  it("rejeita ID com 10 chars", () => {
    expect(extractYoutubeId("dQw4w9WgXc")).toBeNull();
  });

  it("rejeita ID com chars fora do charset", () => {
    expect(extractYoutubeId("dQw4w9WgXc!")).toBeNull();
  });

  it("rejeita string vazia", () => {
    expect(extractYoutubeId("")).toBeNull();
    expect(extractYoutubeId("   ")).toBeNull();
  });

  it("rejeita URL malformada", () => {
    expect(extractYoutubeId("just text")).toBeNull();
  });

  it("rejeita URL de host não suportado (ex: vimeo)", () => {
    expect(extractYoutubeId(`https://vimeo.com/${VALID_ID}`)).toBeNull();
  });

  it("rejeita URL youtube.com sem param v", () => {
    expect(extractYoutubeId("https://www.youtube.com/watch")).toBeNull();
  });
});

describe("buildYoutubeEmbedUrl", () => {
  it("usa youtube-nocookie.com, não youtube.com", () => {
    const url = buildYoutubeEmbedUrl(VALID_ID);
    expect(url.startsWith("https://www.youtube-nocookie.com/embed/")).toBe(true);
    expect(url.includes("//www.youtube.com/")).toBe(false);
  });

  it("inclui o videoId no path", () => {
    expect(buildYoutubeEmbedUrl(VALID_ID)).toContain(`/embed/${VALID_ID}?`);
  });

  it("inclui todos os params de fricção do ADR-016", () => {
    const url = buildYoutubeEmbedUrl(VALID_ID);
    expect(url).toContain("modestbranding=1");
    expect(url).toContain("rel=0");
    expect(url).toContain("iv_load_policy=3");
    expect(url).toContain("disablekb=1");
    expect(url).toContain("playsinline=1");
    expect(url).toContain("fs=1");
  });

  it("não inclui controls=0 (quebraria UX)", () => {
    expect(buildYoutubeEmbedUrl(VALID_ID)).not.toContain("controls=0");
  });

  it("não inclui autoplay=1 (bloqueado em mobile e fricciona UX)", () => {
    expect(buildYoutubeEmbedUrl(VALID_ID)).not.toContain("autoplay=1");
  });

  it("snapshot do shape esperado", () => {
    expect(buildYoutubeEmbedUrl(VALID_ID)).toBe(
      `https://www.youtube-nocookie.com/embed/${VALID_ID}?modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&playsinline=1&fs=1`,
    );
  });
});
