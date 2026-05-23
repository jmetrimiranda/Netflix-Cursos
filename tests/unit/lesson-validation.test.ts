/**
 * Cobertura do schema Zod novo (videoSource) + integração com extractYoutubeId.
 *
 * resolveVideoFields é função interna do actions.ts (server-only). Replicamos
 * a lógica aqui para garantir que o contrato (schema → extract → fields) está
 * batendo com o que o handler vai gravar no Prisma.
 */

import { describe, expect, it } from "vitest";
import { lessonInputSchema } from "../../src/lib/validations/lesson";
import { extractYoutubeId } from "../../src/lib/youtube";

const VALID_ID = "dQw4w9WgXcQ";

describe("lessonInputSchema", () => {
  it("aceita videoSource vazio — tratado como ausência pelo handler", () => {
    const parsed = lessonInputSchema.parse({
      title: "Aula 1",
      videoSource: "",
    });
    // Schema aceita ""; handler usa !videoSource || videoSource.trim() === ""
    // pra detectar ausência. Vale tanto undefined quanto "" no contrato.
    expect(parsed.videoSource ?? "").toBe("");
  });

  it("aceita videoSource omitido", () => {
    const parsed = lessonInputSchema.parse({ title: "Aula 1" });
    expect(parsed.videoSource).toBeUndefined();
  });

  it("preserva videoSource não vazio para o handler validar com extractYoutubeId", () => {
    const parsed = lessonInputSchema.parse({
      title: "Aula 1",
      videoSource: `https://youtu.be/${VALID_ID}`,
    });
    expect(parsed.videoSource).toBe(`https://youtu.be/${VALID_ID}`);
  });

  it("aceita ID puro como videoSource (será validado server-side)", () => {
    const parsed = lessonInputSchema.parse({
      title: "Aula 1",
      videoSource: VALID_ID,
    });
    expect(parsed.videoSource).toBe(VALID_ID);
  });

  it("rejeita videoSource > 500 chars", () => {
    const long = "x".repeat(501);
    const result = lessonInputSchema.safeParse({ title: "Aula", videoSource: long });
    expect(result.success).toBe(false);
  });

  it("trim do videoSource", () => {
    const parsed = lessonInputSchema.parse({
      title: "Aula 1",
      videoSource: `   ${VALID_ID}   `,
    });
    expect(parsed.videoSource).toBe(VALID_ID);
  });

  it("rejeita title vazio", () => {
    const result = lessonInputSchema.safeParse({ title: "", videoSource: "" });
    expect(result.success).toBe(false);
  });
});

describe("schema + extractYoutubeId integration (mirror do server action)", () => {
  function pipeline(rawVideoSource: string) {
    const parsed = lessonInputSchema.parse({
      title: "Aula 1",
      videoSource: rawVideoSource,
    });
    if (!parsed.videoSource || parsed.videoSource.trim() === "") {
      return { youtubeVideoId: null };
    }
    const id = extractYoutubeId(parsed.videoSource);
    if (!id) return null;
    return { youtubeVideoId: id, bunnyVideoId: null, bunnyLibraryId: null };
  }

  it("vazio → zera youtubeVideoId e não toca em bunny*", () => {
    expect(pipeline("")).toEqual({ youtubeVideoId: null });
  });

  it("URL youtu.be válida → ID + zera bunny*", () => {
    expect(pipeline(`https://youtu.be/${VALID_ID}`)).toEqual({
      youtubeVideoId: VALID_ID,
      bunnyVideoId: null,
      bunnyLibraryId: null,
    });
  });

  it("URL youtube.com/watch válida → ID + zera bunny*", () => {
    expect(pipeline(`https://www.youtube.com/watch?v=${VALID_ID}`)).toEqual({
      youtubeVideoId: VALID_ID,
      bunnyVideoId: null,
      bunnyLibraryId: null,
    });
  });

  it("ID puro válido → ID + zera bunny*", () => {
    expect(pipeline(VALID_ID)).toEqual({
      youtubeVideoId: VALID_ID,
      bunnyVideoId: null,
      bunnyLibraryId: null,
    });
  });

  it("URL malformada → null (handler deve rejeitar com error)", () => {
    expect(pipeline("just text")).toBeNull();
  });

  it("ID com tamanho errado → null", () => {
    expect(pipeline("abc")).toBeNull();
  });
});
