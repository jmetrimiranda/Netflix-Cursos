"use client";

import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { toast } from "sonner";

type Props = {
  value: string;
  onChange: (url: string) => void;
  prefix: string;
  accept?: string;
  label?: string;
};

export function ThumbnailUpload({
  value,
  onChange,
  prefix,
  accept = "image/*",
  label = "Thumbnail",
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function handleFile(file: File) {
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const key = `${prefix}/${safeName}`.replace(/\/+/g, "/");

    setProgress(0);
    try {
      const presignRes = await fetch("/api/admin/r2/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, contentType: file.type || "application/octet-stream" }),
      });
      if (!presignRes.ok) {
        const data = (await presignRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Falha ao obter URL de upload");
      }
      const { uploadUrl, publicUrl } = (await presignRes.json()) as {
        uploadUrl: string;
        publicUrl: string;
      };

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload falhou (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Erro de rede no upload"));
        xhr.send(file);
      });

      onChange(publicUrl);
      toast.success("Upload concluído");
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
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={progress !== null}
        >
          {value ? `Trocar ${label.toLowerCase()}` : `Escolher ${label.toLowerCase()}`}
        </Button>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Remover
          </Button>
        ) : null}
        {progress !== null ? (
          <span className="text-xs text-muted-foreground">Enviando... {progress}%</span>
        ) : null}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {value ? <p className="break-all text-xs text-muted-foreground">URL: {value}</p> : null}
    </div>
  );
}
