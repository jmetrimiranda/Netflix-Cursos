"use client";

import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as tus from "tus-js-client";

type Props = {
  videoId: string | null;
  libraryId: string | null;
  defaultTitle: string;
  onUploaded: (info: { videoId: string; libraryId: string }) => void;
  onClear?: () => void;
};

type CreateVideoResponse = {
  videoId: string;
  libraryId: string;
  uploadUrl: string;
  authorizationSignature: string;
  authorizationExpire: number;
};

export function VideoUploader({ videoId, libraryId, defaultTitle, onUploaded, onClear }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [bunnyUnavailable, setBunnyUnavailable] = useState(false);

  async function handleFile(file: File) {
    setProgress(0);
    try {
      const res = await fetch("/api/admin/bunny/create-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: defaultTitle || file.name }),
      });
      if (res.status === 503) {
        setBunnyUnavailable(true);
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Bunny Stream não configurado");
        setProgress(null);
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Falha ao criar vídeo");
      }
      const created = (await res.json()) as CreateVideoResponse;

      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: created.uploadUrl,
          retryDelays: [0, 1000, 3000, 5000],
          metadata: {
            filetype: file.type,
            title: defaultTitle || file.name,
          },
          headers: {
            AuthorizationSignature: created.authorizationSignature,
            AuthorizationExpire: String(created.authorizationExpire),
            VideoId: created.videoId,
            LibraryId: created.libraryId,
          },
          onError: (err) => reject(err),
          onProgress: (sent, total) => {
            setProgress(Math.round((sent / total) * 100));
          },
          onSuccess: () => resolve(),
        });
        upload.start();
      });

      onUploaded({ videoId: created.videoId, libraryId: created.libraryId });
      toast.success("Vídeo enviado");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha no upload";
      toast.error(msg);
    } finally {
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {videoId && libraryId ? (
        <p className="text-xs text-muted-foreground">
          Vídeo ativo: <code className="font-mono">{videoId}</code> (library {libraryId})
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Sem vídeo associado.</p>
      )}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={progress !== null || bunnyUnavailable}
        >
          {videoId ? "Trocar vídeo" : "Enviar vídeo"}
        </Button>
        {videoId && onClear ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Remover referência
          </Button>
        ) : null}
        {progress !== null ? (
          <span className="text-xs text-muted-foreground">Enviando... {progress}%</span>
        ) : null}
      </div>
      {bunnyUnavailable ? (
        <p className="text-xs text-destructive">
          Configure BUNNY_STREAM_API_KEY e BUNNY_STREAM_LIBRARY_ID no .env para enviar vídeos.
        </p>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
