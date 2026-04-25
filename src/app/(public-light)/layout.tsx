import { PublicFooter } from "@/components/public/footer";
import { PublicHeader } from "@/components/public/header";
import { Toaster } from "@/components/ui/sonner";

export default function PublicLightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter variant="light" />
      <Toaster richColors position="top-center" />
    </div>
  );
}
