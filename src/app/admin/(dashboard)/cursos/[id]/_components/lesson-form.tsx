"use client";

import { ThumbnailUpload } from "@/components/admin/thumbnail-upload";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractYoutubeId } from "@/lib/youtube";
import type { JSONContent } from "@tiptap/react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createLessonAction, updateLessonAction } from "../actions";

type Props = {
  mode: "create" | "edit";
  moduleId: string;
  lessonId?: string;
  defaults?: {
    title?: string;
    youtubeVideoId?: string | null;
    bunnyVideoId?: string | null;
    bunnyLibraryId?: string | null;
    sidebarContent?: JSONContent | null;
    sidebarPdfUrl?: string | null;
  };
  onSaved?: () => void;
};

export function LessonForm({ mode, moduleId, lessonId, defaults, onSaved }: Props) {
  const [title, setTitle] = useState(defaults?.title ?? "");
  const [videoSource, setVideoSource] = useState(defaults?.youtubeVideoId ?? "");
  const [sidebarContent, setSidebarContent] = useState<JSONContent | null>(
    defaults?.sidebarContent ?? null,
  );
  const [sidebarPdfUrl, setSidebarPdfUrl] = useState(defaults?.sidebarPdfUrl ?? "");
  const [isPending, startTransition] = useTransition();

  const hasLegacyBunny = Boolean(defaults?.bunnyVideoId);

  const videoState = useMemo<
    { kind: "empty" } | { kind: "valid"; id: string } | { kind: "invalid" }
  >(() => {
    if (!videoSource.trim()) return { kind: "empty" };
    const id = extractYoutubeId(videoSource);
    return id ? { kind: "valid", id } : { kind: "invalid" };
  }, [videoSource]);

  function buildFormData(): FormData {
    const fd = new FormData();
    fd.set("title", title);
    fd.set("videoSource", videoSource);
    fd.set("sidebarContentJson", sidebarContent ? JSON.stringify(sidebarContent) : "");
    fd.set("sidebarPdfUrl", sidebarPdfUrl ?? "");
    return fd;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) {
      toast.error("Título obrigatório");
      return;
    }
    if (videoState.kind === "invalid") {
      toast.error("URL ou ID do YouTube inválido");
      return;
    }
    startTransition(async () => {
      const fd = buildFormData();
      const result =
        mode === "create"
          ? await createLessonAction(moduleId, fd)
          : lessonId
            ? await updateLessonAction(lessonId, fd)
            : { error: "ID da aula ausente" };
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      onSaved?.();
      window.location.reload();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-border bg-card p-4">
      <div className="space-y-2">
        <Label htmlFor={`lesson-title-${lessonId ?? "new"}`}>Título da aula</Label>
        <Input
          id={`lesson-title-${lessonId ?? "new"}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`lesson-video-${lessonId ?? "new"}`}>Vídeo (YouTube)</Label>

        <div
          role="note"
          className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200"
        >
          Configure o vídeo como <strong>Não listado</strong> no YouTube Studio antes de colar a URL
          aqui. YouTube não oferece restrição por domínio: qualquer pessoa com o link pode assistir.
          Detalhes do trade-off em <code>ADR-016</code>.
        </div>

        {hasLegacyBunny && (
          <div
            role="note"
            className="rounded-md border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs text-blue-900 dark:text-blue-200"
          >
            Esta aula tem vídeo legado em Bunny Stream. Colar uma URL/ID do YouTube vai migrar — o
            Bunny será desvinculado da aula. Se você salvar sem colar nada, o Bunny continua
            tocando.
          </div>
        )}

        <Input
          id={`lesson-video-${lessonId ?? "new"}`}
          value={videoSource}
          onChange={(e) => setVideoSource(e.target.value)}
          placeholder="Cole a URL ou ID do YouTube (ex: https://youtu.be/dQw4w9WgXcQ)"
          aria-invalid={videoState.kind === "invalid"}
        />

        {videoState.kind === "empty" && (
          <p className="text-xs text-muted-foreground">Cole a URL ou o ID de 11 chars.</p>
        )}
        {videoState.kind === "valid" && (
          <p className="text-xs text-emerald-600">✓ ID detectado: {videoState.id}</p>
        )}
        {videoState.kind === "invalid" && (
          <p className="text-xs text-destructive">URL ou ID inválido.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Material lateral (Tiptap)</Label>
        <TiptapEditor value={sidebarContent} onChange={setSidebarContent} />
      </div>

      <div className="space-y-2">
        <Label>PDF complementar (opcional)</Label>
        <ThumbnailUpload
          value={sidebarPdfUrl ?? ""}
          onChange={(url) => setSidebarPdfUrl(url)}
          prefix="lesson-pdfs"
          accept="application/pdf"
          label="PDF"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending || videoState.kind === "invalid"}>
          {isPending ? "Salvando..." : mode === "create" ? "Criar aula" : "Salvar aula"}
        </Button>
      </div>
    </form>
  );
}
