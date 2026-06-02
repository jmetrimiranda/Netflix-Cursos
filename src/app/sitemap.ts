import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";

const STATIC_ROUTES: {
  path: string;
  changeFreq: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFreq: "monthly", priority: 1 },
  { path: "/servicos", changeFreq: "monthly", priority: 0.9 },
  { path: "/cursos", changeFreq: "weekly", priority: 0.9 },
  { path: "/privacidade", changeFreq: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${siteUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));

  let courseEntries: MetadataRoute.Sitemap = [];
  try {
    const courses = await db.course.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });
    courseEntries = courses.map((c) => ({
      url: `${siteUrl}/cursos/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB may be unavailable at build time on a fresh deploy; degrade gracefully.
  }

  return [...staticEntries, ...courseEntries];
}
