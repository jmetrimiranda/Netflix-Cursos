import { CertificateGate } from "@/components/public/certificate-gate";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

type RouteParams = { slug: string };

export default async function CertificadoPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const course = await db.course.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, published: true },
  });
  if (!course || !course.published) notFound();
  return <CertificateGate courseId={course.id} courseSlug={course.slug} />;
}
