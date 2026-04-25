import { CourseCard, type CourseCardData } from "@/components/public/course-card";

export function CourseRow({
  title,
  courses,
  variant = "thumbnail",
}: {
  title: string;
  courses: CourseCardData[];
  variant?: "thumbnail" | "poster";
}) {
  if (courses.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="px-4 text-lg font-semibold text-foreground sm:px-6">{title}</h2>
      <div className="-mx-4 sm:-mx-6">
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 scrollbar-thin scroll-pl-4 sm:gap-4 sm:px-6 sm:scroll-pl-6">
          {courses.map((course) => (
            <CourseCard key={course.slug} course={course} variant={variant} />
          ))}
        </div>
      </div>
    </section>
  );
}
