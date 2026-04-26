import type { Metadata } from "next";

export const SITE_NAME = "Ativa Engenharia";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

const DEFAULT_OG_IMAGE = "/images/landing/hero-01.png";

type OgImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export function defaultOgImages(): OgImage[] {
  return [
    {
      url: DEFAULT_OG_IMAGE,
      width: 1200,
      height: 630,
      alt: "Equipe da Ativa Engenharia em campo",
    },
  ];
}

type BuildMetadataInput = {
  title: string;
  description: string;
  path: string;
  ogImages?: OgImage[];
};

export function buildMetadata({
  title,
  description,
  path,
  ogImages,
}: BuildMetadataInput): Metadata {
  const url = `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const images = ogImages ?? defaultOgImages();
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "pt_BR",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((img) => img.url),
    },
  };
}
