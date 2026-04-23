# Netflix-Cursos

Plataforma de cursos online (engenharia civil, mecânica, segurança do trabalho) com catálogo público estilo Netflix, player com material lateral, prova, e emissão de certificado pago via Pix.

Documentos de referência:

- [`SPEC.md`](./SPEC.md) — visão, stack, modelo de dados, fluxos, ADRs.
- [`CLAUDE.md`](./CLAUDE.md) — regras operacionais (git flow, comandos, gates).
- [`plan.md`](./plan.md) — roadmap em fases F0 → F5.
- [`task.md`](./task.md) — histórico append-only de sessões.

---

## Stack resumida

Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · Prisma + PostgreSQL 16 · Auth.js v5 (F1+) · Biome · Vitest · Playwright. Detalhes em `SPEC.md §2`.

---

## Rodando localmente (VS Code Dev Container — recomendado)

Pré-requisitos no host: Git, Docker, VS Code com a extensão **Dev Containers**.

1. Clone e abra o repo no VS Code:

   ```bash
   git clone https://github.com/jmetrimiranda/Netflix-Cursos
   cd Netflix-Cursos
   code .
   ```

2. No VS Code: `F1` → `Dev Containers: Reopen in Container`. O build levanta:
   - serviço `app` baseado em `mcr.microsoft.com/devcontainers/typescript-node:20` com pnpm e cloudflared;
   - serviço `db` com Postgres 16 em `localhost:5432` (usuário `postgres`, senha `postgres`, banco `netflix_cursos`).

3. Dentro do container:

   ```bash
   cp .env.example .env       # ajuste ADMIN_SEED_PASSWORD / AUTH_SECRET
   pnpm db:migrate            # aplica a migration `init`
   pnpm db:seed                # cria o admin (executa a partir de F1 quando argon2 estiver em uso real)
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
| `pnpm db:seed` | Cria o admin a partir de `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` |
| `pnpm db:studio` | Abre Prisma Studio |
| `pnpm db:reset` | Reseta o banco local |
| `pnpm admin:reset-password` | Stub — implementação completa em F1 |
| `pnpm gates` | `typecheck && lint && test` (rodar antes de cada commit) |

Detalhes de processo (branches, conventional commits, `task.md`) em `CLAUDE.md`.

---

## Estado atual

**F0 — Bootstrap.** Projeto de pé com scaffolding do Next 15, Biome, Vitest, Playwright, shadcn/ui (tema dark padrão), Prisma com `AdminUser`, dev container, CI e página placeholder em `/`. Próxima fase: **F1 — Auth + Shell do Admin** (ver `plan.md`).
