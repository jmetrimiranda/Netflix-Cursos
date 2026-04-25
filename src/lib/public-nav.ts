export type PublicNavItem = {
  href: string;
  label: string;
};

export const PUBLIC_NAV: PublicNavItem[] = [
  { href: "/", label: "Home" },
  { href: "/servicos", label: "Serviços" },
  { href: "/cursos", label: "Cursos" },
  { href: "/quem-somos", label: "Quem Somos" },
  { href: "/faq", label: "FAQ" },
  { href: "/contato", label: "Contato" },
];

export function isCursoRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/cursos" || pathname.startsWith("/cursos/");
}

export function isActiveNavItem(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  if (href === "/cursos") return isCursoRoute(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}
