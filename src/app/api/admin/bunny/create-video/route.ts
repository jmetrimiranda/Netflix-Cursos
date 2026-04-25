import { auth } from "@/lib/auth";
import { createVideo, isBunnyConfigured } from "@/lib/bunny";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  title: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isBunnyConfigured()) {
    return NextResponse.json(
      {
        error:
          "Bunny Stream não configurado. Defina BUNNY_STREAM_API_KEY e BUNNY_STREAM_LIBRARY_ID no .env.",
      },
      { status: 503 },
    );
  }

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  try {
    const created = await createVideo(parsed.data.title);
    return NextResponse.json({
      videoId: created.videoId,
      libraryId: created.libraryId,
      uploadUrl: created.uploadUrl,
      authorizationSignature: created.authorizationSignature,
      authorizationExpire: created.authorizationExpire,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
