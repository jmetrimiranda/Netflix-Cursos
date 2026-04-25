import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl, contact } from "@/content/contact";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "icon";

type WhatsAppButtonProps = {
  message?: string;
  variant?: Variant;
  className?: string;
  label?: string;
  showNumber?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#1ebd5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/40",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-md border border-[#25D366] px-5 py-3 text-base font-semibold text-[#1c8e44] transition-colors hover:bg-[#25D366]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/40",
  icon: "inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition-colors hover:bg-[#1ebd5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/40",
};

export function WhatsAppButton({
  message,
  variant = "primary",
  className,
  label,
  showNumber = false,
}: WhatsAppButtonProps) {
  const href = buildWhatsAppUrl(message);
  const text = label ?? "Falar agora pelo WhatsApp";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${text}${showNumber ? ` — ${contact.whatsappDisplay}` : ""}`}
      className={cn(variantClasses[variant], className)}
    >
      <MessageCircle aria-hidden="true" className="size-5" />
      {variant !== "icon" && (
        <span>
          {text}
          {showNumber && (
            <span className="ml-2 hidden font-normal opacity-90 sm:inline">
              {contact.whatsappDisplay}
            </span>
          )}
        </span>
      )}
    </a>
  );
}
