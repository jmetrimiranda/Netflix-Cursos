import { auth } from "@/lib/auth";
import { createPresignedUploadUrl, isR2Configured } from "@/lib/r2";
import { NextResponse } from "next/server";
import { z } from "zod";

const ALLOWED_PREFIXES = ["image/", "application/pdf"] as const;

const bodySchema = z.object({
  key: z
    .string()
    .min(1)
    .max(512)
    .regex(/^[a-zA-Z0-9._\-/]+$/, "key inválida")
    .refine((k) => !k.startsWith("/") && !k.includes(".."), "key inválida"),
  contentType: z.string().min(1).max(128),
});

function isAllowedContentType(ct: string) {
  return ALLOWED_PREFIXES.some((prefix) =>
    prefix.endsWith("/") ? ct.startsWith(prefix) : ct === prefix,
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Cloudflare R2 não configurado. Defina R2_* no .env." },
      { status: 503 },
    );
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const { key, contentType } = parsed.data;
  if (!isAllowedContentType(contentType)) {
    return NextResponse.json(
      { error: "contentType não permitido (apenas image/* e application/pdf)" },
      { status: 400 },
    );
  }

  const { uploadUrl, publicUrl } = await createPresignedUploadUrl(key, contentType);
  return NextResponse.json({ uploadUrl, publicUrl });
}
