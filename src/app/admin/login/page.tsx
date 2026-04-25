import { Toaster } from "@/components/ui/sonner";
import { LoginForm } from "./login-form";

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Acesso administrativo</h1>
          <p className="text-sm text-muted-foreground">
            Entre com suas credenciais para gerenciar os cursos.
          </p>
        </div>
        <LoginForm callbackUrl={callbackUrl} />
      </div>
      <Toaster richColors position="top-center" />
    </main>
  );
}
