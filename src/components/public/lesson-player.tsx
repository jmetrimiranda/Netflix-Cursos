import { buildBunnyEmbedUrl } from "@/lib/bunny-embed";

type Props = {
  libraryId: string | null;
  videoId: string | null;
  title: string;
};

export function LessonPlayer({ libraryId, videoId, title }: Props) {
  if (!libraryId || !videoId) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-white/10 bg-zinc-900 text-sm text-muted-foreground">
        Vídeo não disponível para esta aula.
      </div>
    );
  }

  const src = buildBunnyEmbedUrl(libraryId, videoId);
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black ring-1 ring-white/5">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}
