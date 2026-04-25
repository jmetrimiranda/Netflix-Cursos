import Image from "next/image";
import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Ativa Engenharia"
          className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground sm:text-lg"
        >
          <Image
            src="/images/brand/logo.png"
            alt=""
            width={28}
            height={28}
            priority
            className="h-7 w-7 object-contain dark:brightness-0 dark:invert"
          />
          <span>Ativa Engenharia</span>
        </Link>
      </div>
    </header>
  );
}
