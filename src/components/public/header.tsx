import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg"
        >
          Netflix-Cursos
        </Link>
      </div>
    </header>
  );
}
