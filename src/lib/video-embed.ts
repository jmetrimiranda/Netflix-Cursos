/**
 * Router de embed de vídeo. Decide entre YouTube (preferido por ADR-016) e
 * Bunny Stream (legado, mantido durante a transição para rollback rápido).
 *
 * Quando uma Lesson tem youtubeVideoId populado, YouTube ganha; isso permite
 * "migrar" aula a aula em produção sem precisar limpar campos Bunny no mesmo
 * passo. A limpeza dos campos Bunny vem em PR separado após ≥1 semana estável.
 */

import { buildBunnyEmbedUrl } from "@/lib/bunny-embed";
import { buildYoutubeEmbedUrl } from "@/lib/youtube";

export type VideoEmbed = {
  src: string;
  provider: "youtube" | "bunny";
};

export type VideoEmbedInput = {
  youtubeVideoId?: string | null;
  bunnyVideoId?: string | null;
  bunnyLibraryId?: string | null;
};

export function buildVideoEmbedUrl(lesson: VideoEmbedInput): VideoEmbed | null {
  if (lesson.youtubeVideoId) {
    return {
      src: buildYoutubeEmbedUrl(lesson.youtubeVideoId),
      provider: "youtube",
    };
  }

  if (lesson.bunnyVideoId && lesson.bunnyLibraryId) {
    return {
      src: buildBunnyEmbedUrl(lesson.bunnyLibraryId, lesson.bunnyVideoId),
      provider: "bunny",
    };
  }

  return null;
}
