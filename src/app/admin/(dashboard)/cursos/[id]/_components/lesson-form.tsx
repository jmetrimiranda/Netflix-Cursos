"use client";

import { ThumbnailUpload } from "@/components/admin/thumbnail-upload";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { VideoUploader } from "@/components/admin/video-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { JSONContent } from "@tiptap/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createLessonAction, updateLessonAction } from "../actions";

type Props = {
  mode: "create" | "edit";
  moduleId: string;
  lessonId?: string;
  defaults?: {
    title?: string;
    bunnyVideoId?: string | null;
    bunnyLibraryId?: string | null;
    sidebarContent?: JSONContent | null;
    sidebarPdfUrl?: string | null;
  };
  onSaved?: () => void;
};

export function LessonForm({ mode, moduleId, lessonId, defaults, onSaved }: Props) {
  const [title, setTitle] = useState(defaults?.title ?? "");
  const [bunnyVideoId, setBunnyVideoId] = useState(defaults?.bunnyVideoId ?? "");
  const [bunnyLibraryId, setBunnyLibraryId] = useState(defaults?.bunnyLibraryId ?? "");
  const [sidebarContent, setSidebarContent] = useState<JSONContent | null>(
    defaults?.sidebarContent ?? null,
  );
  const [sidebarPdfUrl, setSidebarPdfUrl] = useState(defaults?.sidebarPdfUrl ?? "");
  const [isPending, startTransition] = useTransition();

  function buildFormData(): FormData {
    const fd = new FormData();
    fd.set("title", title);
    fd.set("bunnyVideoId", bunnyVideoId ?? "");
    fd.set("bunnyLibraryId", bunnyLibraryId ?? "");
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
      } else {
        toast.success(mode === "create" ? "Aula criada" : "Aula atualizada");
        if (mode === "create") {
          setTitle("");
          setBunnyVideoId("");
          setBunnyLibraryId("");
          setSidebarContent(null);
          setSidebarPdfUrl("");
        }
        onSaved?.();
      }
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
        <Label>Vídeo (Bunny Stream)</Label>
        <VideoUploader
          videoId={bunnyVideoId || null}
          libraryId={bunnyLibraryId || null}
          defaultTitle={title}
          onUploaded={(info) => {
            setBunnyVideoId(info.videoId);
            setBunnyLibraryId(info.libraryId);
          }}
          onClear={() => {
            setBunnyVideoId("");
            setBunnyLibraryId("");
          }}
        />
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
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : mode === "create" ? "Criar aula" : "Salvar aula"}
        </Button>
      </div>
    </form>
  );
}
