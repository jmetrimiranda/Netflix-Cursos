"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { isActiveNavItem, isCursoRoute, PUBLIC_NAV } from "@/lib/public-nav";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isDark = isCursoRoute(pathname);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <header
      data-theme={isDark ? "dark" : "light"}
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur transition-colors",
        isDark
          ? "border-white/10 bg-[hsl(215_35%_6%/0.85)] text-white"
          : "border-border bg-background/85 text-foreground",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Ativa Engenharia — página inicial"
          className="flex items-center gap-2"
        >
          <Image
            src="/images/brand/logo.png"
            alt=""
            width={36}
            height={36}
            priority
            className={cn(
              "h-8 w-8 object-contain",
              isDark && "brightness-0 invert",
            )}
          />
          <span
            className={cn(
              "text-base font-semibold tracking-tight sm:text-lg",
              isDark ? "text-white" : "text-foreground",
            )}
          >
            Ativa Engenharia
          </span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-1 lg:flex"
        >
          {PUBLIC_NAV.map((item) => {
            const active = isActiveNavItem(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? isDark
                      ? "bg-white/10 text-white"
                      : "bg-primary/10 text-primary"
                    : isDark
                      ? "text-white/80 hover:bg-white/5 hover:text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <WhatsAppButton variant="primary" label="WhatsApp" className="px-4 py-2 text-sm" />
        </div>

        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="public-mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors lg:hidden",
            isDark
              ? "text-white hover:bg-white/10"
              : "text-foreground hover:bg-muted",
          )}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div
          id="public-mobile-nav"
          className={cn(
            "border-t lg:hidden",
            isDark
              ? "border-white/10 bg-[hsl(215_35%_8%)]"
              : "border-border bg-background",
          )}
        >
          <nav
            aria-label="Navegação móvel"
            className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6"
          >
            {PUBLIC_NAV.map((item) => {
              const active = isActiveNavItem(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-base font-medium transition-colors",
                    active
                      ? isDark
                        ? "bg-white/10 text-white"
                        : "bg-primary/10 text-primary"
                      : isDark
                        ? "text-white/85 hover:bg-white/5 hover:text-white"
                        : "text-foreground hover:bg-muted",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-3">
              <WhatsAppButton variant="primary" label="WhatsApp" showNumber />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
