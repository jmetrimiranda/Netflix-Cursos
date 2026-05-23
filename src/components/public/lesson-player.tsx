"use client";

import { buildVideoEmbedUrl, type VideoEmbedInput } from "@/lib/video-embed";

/**
 * Player de aula. Roteia entre YouTube unlisted (preferido por ADR-016) e
 * Bunny Stream (legado).
 *
 * `onContextMenu={preventDefault}` e `select-none` no wrapper são camadas de
 * fricção contra cópia casual — não são proteção. Browser não permite
 * interceptar eventos dentro de iframe cross-origin, então qualquer usuário
 * com inspect element ou yt-dlp baixa o conteúdo. Trade-off aceito em ADR-016.
 */

type LessonPlayerProps = {
  lesson: VideoEmbedInput;
  title: string;
};

export function LessonPlayer({ lesson, title }: LessonPlayerProps) {
  const embed = buildVideoEmbedUrl(lesson);

  if (!embed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-white/10 bg-zinc-900 text-sm text-muted-foreground">
        Vídeo não disponível para esta aula.
      </div>
    );
  }

  return (
    <div
      className="aspect-video w-full select-none overflow-hidden rounded-lg bg-black ring-1 ring-white/5"
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        src={embed.src}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}
