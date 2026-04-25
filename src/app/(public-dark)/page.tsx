import type { CourseCardData } from "@/components/public/course-card";
import { CourseRow } from "@/components/public/course-row";
import { type HeroCourse, HeroSection } from "@/components/public/hero-section";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/categories";
import { db } from "@/lib/db";
import type { CourseCategory } from "@prisma/client";

type CatalogCourse = CourseCardData & { id: string };

async function loadCatalog(): Promise<{
  hero: HeroCourse | null;
  byCategory: Map<CourseCategory, CatalogCourse[]>;
}> {
  const courses = await db.course.findMany({
    where: { published: true },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      thumbnailUrl: true,
      workloadHours: true,
      featured: true,
      createdAt: true,
      updatedAt: true,
      modules: { select: { lessons: { select: { id: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const list = courses.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    category: c.category,
    thumbnailUrl: c.thumbnailUrl,
    workloadHours: c.workloadHours,
    featured: c.featured,
    lessonsCount: c.modules.reduce((acc, m) => acc + m.lessons.length, 0),
  }));

  const featured = list.find((c) => c.featured) ?? list[0] ?? null;
  const hero: HeroCourse | null = featured
    ? {
        slug: featured.slug,
        title: featured.title,
        description: featured.description,
        category: featured.category,
        thumbnailUrl: featured.thumbnailUrl,
      }
    : null;

  const byCategory = new Map<CourseCategory, CatalogCourse[]>();
  for (const cat of CATEGORY_ORDER) byCategory.set(cat, []);
  for (const c of list) {
    const bucket = byCategory.get(c.category);
    if (bucket) bucket.push(c);
  }

  return { hero, byCategory };
}

export default async function HomePage() {
  const { hero, byCategory } = await loadCatalog();

  return (
    <div className="space-y-10 pb-16">
      <HeroSection course={hero} />
      <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
        {CATEGORY_ORDER.map((cat) => (
          <CourseRow key={cat} title={CATEGORY_LABELS[cat]} courses={byCategory.get(cat) ?? []} />
        ))}
        {Array.from(byCategory.values()).every((arr) => arr.length === 0) && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhum curso publicado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
