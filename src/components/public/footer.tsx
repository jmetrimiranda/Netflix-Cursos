import { AtSign, Mail, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { contact } from "@/content/contact";
import { team } from "@/content/team";
import { PUBLIC_NAV } from "@/lib/public-nav";
import { cn } from "@/lib/utils";

type PublicFooterProps = {
  variant?: "light" | "dark";
};

export function PublicFooter({ variant = "light" }: PublicFooterProps) {
  const isDark = variant === "dark";

  return (
    <footer
      className={cn(
        "border-t",
        isDark
          ? "border-white/10 bg-[hsl(215_35%_5%)] text-white/85"
          : "border-border bg-muted/40 text-foreground",
      )}
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {/* 1. Brand + slogan */}
        <div className="space-y-4">
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
              className={cn("h-9 w-9 object-contain", isDark && "brightness-0 invert")}
            />
            <span className="text-base font-semibold tracking-tight">
              Ativa Engenharia
            </span>
          </Link>
          <p
            className={cn(
              "text-sm",
              isDark ? "text-white/70" : "text-muted-foreground",
            )}
          >
            Segurança e Qualidade.
          </p>
        </div>

        {/* 2. Nav */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            Navegação
          </h3>
          <ul className="space-y-2 text-sm">
            {PUBLIC_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "transition-colors",
                    isDark
                      ? "text-white/70 hover:text-white"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Contact */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            Contato
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href={`https://wa.me/${contact.whatsappRaw}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-2 transition-colors",
                  isDark
                    ? "text-white/80 hover:text-white"
                    : "text-foreground hover:text-primary",
                )}
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                {contact.whatsappDisplay}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${contact.email}`}
                className={cn(
                  "inline-flex items-center gap-2 transition-colors",
                  isDark
                    ? "text-white/80 hover:text-white"
                    : "text-foreground hover:text-primary",
                )}
              >
                <Mail aria-hidden="true" className="size-4" />
                {contact.email}
              </a>
            </li>
            <li>
              <a
                href={contact.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-2 transition-colors",
                  isDark
                    ? "text-white/80 hover:text-white"
                    : "text-foreground hover:text-primary",
                )}
              >
                <AtSign aria-hidden="true" className="size-4" />
                {contact.instagram}
              </a>
            </li>
            <li>
              <a
                href={contact.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "transition-colors",
                  isDark
                    ? "text-white/70 hover:text-white"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {contact.website}
              </a>
            </li>
          </ul>
        </div>

        {/* 4. Responsáveis técnicos */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            Responsáveis técnicos
          </h3>
          <ul
            className={cn(
              "space-y-2 text-xs leading-relaxed",
              isDark ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {team.map((member) => (
              <li key={member.crea}>
                <span
                  className={cn(
                    "block font-medium",
                    isDark ? "text-white" : "text-foreground",
                  )}
                >
                  {member.name}
                </span>
                <span>{member.role}</span>
                <span className="block">{member.crea}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className={cn(
          "border-t",
          isDark ? "border-white/10" : "border-border",
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-5 text-xs sm:flex-row sm:items-center sm:px-6",
            isDark ? "text-white/60" : "text-muted-foreground",
          )}
        >
          <p>
            © {new Date().getFullYear()} Ativa Engenharia. Todos os direitos
            reservados.
          </p>
          <Link
            href="/privacidade"
            className={cn(
              "transition-colors",
              isDark ? "hover:text-white" : "hover:text-foreground",
            )}
          >
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
