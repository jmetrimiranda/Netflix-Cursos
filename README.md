# Ativa Engenharia

Site institucional + plataforma de cursos online da **Ativa Engenharia** (climatização, elétrica, mecânica, civil e segurança do trabalho). Catálogo público estilo Netflix, player com material lateral, prova e emissão de certificado pago via Pix.

Documentos de referência:

- [`SPEC.md`](./SPEC.md) — visão, stack, modelo de dados, fluxos, ADRs.
- [`CLAUDE.md`](./CLAUDE.md) — regras operacionais (git flow, comandos, gates).
- [`plan.md`](./plan.md) — roadmap em fases F0 → F5.
- [`task.md`](./task.md) — histórico append-only de sessões.

---

## Stack resumida

Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · Prisma + PostgreSQL 16 · Auth.js v5 · Biome · Vitest · Playwright. Detalhes em `SPEC.md §2`.

---

## Rodando localmente (VS Code Dev Container — recomendado)

Pré-requisitos no host: Git, Docker, VS Code com a extensão **Dev Containers**.

1. Clone e abra o repo no VS Code:

   ```bash
   git clone https://github.com/jmetrimiranda/Netflix-Cursos
   cd Netflix-Cursos
   code .
   ```

   > Observação: o repositório no GitHub ainda se chama `Netflix-Cursos` por motivos históricos. O produto é **Ativa Engenharia**.

2. No VS Code: `F1` → `Dev Containers: Reopen in Container`. O build levanta:
   - serviço `app` baseado em `mcr.microsoft.com/devcontainers/typescript-node:20` com pnpm e cloudflared;
   - serviço `db` com Postgres 16 em `localhost:5432` (usuário `postgres`, senha `postgres`, banco `ativa_engenharia`).

3. Dentro do container:

   ```bash
   cp .env.example .env       # ajuste ADMIN_SEED_PASSWORD / AUTH_SECRET
   pnpm db:migrate            # aplica as migrations
   pnpm db:seed               # cria o admin + curso de exemplo
   pnpm dev                   # http://localhost:3000
   ```

## Rodando sem Dev Container

Precisa de Node 20+, pnpm 9+ e um Postgres 16 alcançável via `DATABASE_URL`.

```bash
pnpm install
cp .env.example .env   # ajuste DATABASE_URL + ADMIN_SEED_PASSWORD
pnpm db:migrate
pnpm dev
```

---

## Comandos úteis

| Comando | O que faz |
|---|---|
| `pnpm dev` | Next dev server em :3000 |
| `pnpm build` | Build de produção |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` / `pnpm lint:fix` | Biome check (+ auto-fix) |
| `pnpm format` | Biome format |
| `pnpm test` / `pnpm test:watch` | Vitest |
| `pnpm test:e2e` / `pnpm test:e2e:ui` | Playwright |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:seed` | Cria o admin + curso de exemplo |
| `pnpm db:studio` | Abre Prisma Studio |
| `pnpm db:reset` | Reseta o banco local |
| `pnpm admin:reset-password` | CLI interativa pra trocar a senha do admin |
| `pnpm gates` | `typecheck && lint && test` (rodar antes de cada commit) |

Detalhes de processo (branches, conventional commits, `task.md`) em `CLAUDE.md`.

---

## Estado atual

**F3.5 — Rebrand Ativa Engenharia + Landing Institucional.** Site institucional em light mode (`/`, `/servicos`, `/quem-somos`, `/faq`, `/contato`) + plataforma de cursos em dark mode (`/cursos`, `/cursos/[slug]`, `/cursos/[slug]/aulas/[id]`) + admin (`/admin/*`). Próxima fase: **F4 — Prova + Pix + Certificado** (ver `plan.md`).
