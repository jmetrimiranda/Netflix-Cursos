import { signOutAction } from "@/app/admin/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/cursos", label: "Cursos" },
  { href: "/admin/alunos", label: "Alunos" },
];

export function AdminSidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="px-4 py-5">
        <Link href="/admin" className="text-base font-semibold">
          Netflix-Cursos
        </Link>
        <p className="text-xs text-muted-foreground">Painel administrativo</p>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <form action={signOutAction} className="border-t border-border p-3">
        <Button type="submit" variant="ghost" className="w-full justify-start">
          Sair
        </Button>
      </form>
    </aside>
  );
}
