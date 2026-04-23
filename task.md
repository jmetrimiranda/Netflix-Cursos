# task.md — Histórico de sessões

> Append-only. Cada sessão de trabalho adiciona uma entrada ao final seguindo o formato descrito em `CLAUDE.md §7`.

---
## 2026-04-23 17:55 — feature/bootstrap — Setup inicial do projeto (F0)

**Fase:** F0
**PR:** em andamento (aberto contra `develop`)

### O que foi feito
- Host setup: `winget install OpenJS.NodeJS.LTS` (Node 24.15.0), `winget install GitHub.cli` (gh 2.91.0), `npm i -g pnpm` (pnpm 10.33.2).
- Git flow inicial: commit inicial dos docs em `main` (branch principal renomeada de `master`/`main`), criação de `develop` a partir de `main`, criação de `feature/bootstrap` a partir de `develop`. `.gitignore` inclui `SETUP.md` e `prompt_yolo_f0.md` (arquivos locais do Jorge).
- Scaffold Next.js 15 via `pnpm create next-app@15`: App Router, TypeScript strict, Tailwind v4, src dir, Turbopack.
- Biome configurado (`biome.json`) com `lint`, `lint:fix`, `format`; nenhuma config de ESLint/Prettier gerada.
- Vitest (`vitest.config.ts`, `tests/setup.ts`, `tests/unit/smoke.test.ts`) + Playwright (`playwright.config.ts`, `tests/e2e/smoke.spec.ts`).
- shadcn/ui iniciado com `pnpm dlx shadcn@latest init -d --yes`. Tema dark default via `className="dark"` em `<html>`. Primitivos instalados: `button`, `input`, `label`, `dialog`, `form`, `card`, `sonner` (toast).
- Prisma iniciado: `prisma/schema.prisma` contém **apenas** `AdminUser` (`id`, `email` único, `passwordHash`, `createdAt`). Migration inicial `20260423000000_init/migration.sql` escrita manualmente (sem Docker no host). `prisma/seed.ts` usa `argon2.argon2id` e lê `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` via upsert idempotente.
- `src/lib/db.ts` — Prisma client singleton com guard para HMR em dev.
- `scripts/admin-reset-password.ts` — stub que imprime `TODO: implementar em F1`.
- `.env.example` — todas as variáveis do SPEC §7, sem valores reais.
- Dev container: `.devcontainer/Dockerfile` (mcr.microsoft.com/devcontainers/typescript-node:20 + pnpm via corepack + cloudflared), `.devcontainer/docker-compose.yml` (serviço `db` postgres:16 + `app`), `.devcontainer/devcontainer.json` (forwardPorts 3000/5432, extensões VS Code).
- CI: `.github/workflows/ci.yml` roda gates (typecheck + lint + test) em `push` para `feature/**` e PRs contra `develop`/`main`. Node 20 + cache pnpm + concurrency cancel-in-progress.
- PR template em `.github/pull_request_template.md` conforme CLAUDE.md §6.5.
- `package.json` com todos os scripts do CLAUDE.md §4, incluindo `pnpm gates` (typecheck + lint + test).
- Página placeholder em `/` exibindo "Netflix-Cursos — em construção" centralizado, dark por default, lang="pt-BR".
- README com setup local, instruções do dev container e tabela de comandos.
- `pnpm gates` passa green (typecheck + lint + test).

### Arquivos tocados
- `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `biome.json`, `vitest.config.ts`, `playwright.config.ts`, `components.json`, `.gitignore`, `.env.example`, `README.md`, `task.md`
- `prisma/schema.prisma`, `prisma/migrations/20260423000000_init/migration.sql`, `prisma/migrations/migration_lock.toml`, `prisma/seed.ts`
- `src/app/{layout,page}.tsx`, `src/app/globals.css`, `src/global.d.ts`
- `src/components/ui/{button,input,label,dialog,form,card,sonner}.tsx`
- `src/lib/{db,utils}.ts`
- `scripts/admin-reset-password.ts`
- `tests/setup.ts`, `tests/unit/smoke.test.ts`, `tests/e2e/smoke.spec.ts`
- `.devcontainer/{devcontainer.json,Dockerfile,docker-compose.yml}`
- `.github/workflows/ci.yml`, `.github/pull_request_template.md`

### Decisões
- **Substituição `toast` → `sonner`.** O componente `toast` do shadcn foi deprecado; o registry força `sonner` (confirmado por erro explícito do CLI). `sonner` usa a mesma API de toasts imperativos, sem impacto funcional.
- **shadcn preset = `base-nova` (default).** Usa `@base-ui/react` como primitivo ao invés de Radix direto. Isso é o padrão atual do `shadcn init -d`. O `form.tsx` foi adicionado a partir do registry `new-york-v4` (base-nova não expõe `form`) e traz `react-hook-form` + `@hookform/resolvers` + `zod` + `radix-ui` como deps. Sem impacto no comportamento dos formulários.
- **Next.js 15.5 (não 16).** `create-next-app@latest` hoje gera Next 16; o SPEC pede 15 explicitamente, então o scaffold foi feito com `create-next-app@15`.
- **Node 24 no host via winget.** `OpenJS.NodeJS.LTS` atualmente empacota Node 24 (não 20). Host só é usado pro scaffold e para rodar `pnpm gates` localmente — CI (Node 20) e dev container (Node 20) mantêm a versão alvo.
- **Primeira migration escrita manualmente.** Sem Docker no host, não deu pra rodar `prisma migrate dev`. SQL corresponde exatamente ao que o Prisma geraria para o schema atual. Será aplicada com `pnpm db:migrate` dentro do dev container (ou contra Neon em prod).
- **Vitest com `css: false` + `css.postcss: { plugins: [] }`.** Necessário pra evitar que Vite tente carregar `@tailwindcss/postcss` durante os testes (plugin não é compatível com a pipeline PostCSS do Vite 5).
- **`ADMIN_SEED_PASSWORD=31415926` no `.env.example`.** Copiado do SPEC §7 / CLAUDE.md §12. O seed é idempotente e não atualiza o hash em registros existentes, então a senha inicial não é sobrescrita acidentalmente em runs subsequentes.
- **Commit split em 4:** `chore: bootstrap project`, `chore(devcontainer): ...`, `chore(ci): ...`, `docs: update task.md with F0 summary`. Cada commit deixa `pnpm gates` green.

### Próximos passos (F1)
- Implementar `src/lib/auth.ts` + Auth.js v5 (Credentials provider) + `src/app/api/auth/[...nextauth]/route.ts`.
- `src/middleware.ts` protegendo `/admin/*` exceto `/admin/login`.
- `/admin/login` form + `/admin` dashboard com cards mocados.
- Implementar `pnpm admin:reset-password` real (CLI interativa tsx que atualiza `AdminUser.passwordHash`).
- E2E: login happy path + senha errada.

### Blockers / pendências
- Jorge precisa proteger `main` e `develop` na UI do GitHub (Settings → Branches → Branch protection rules) antes de começar F1 — conforme SETUP.md passo 4.
- CI vai rodar no PR aberto e validar gates; se quebrar por diferença de plataforma (Windows host × Ubuntu CI), conserto antes de mergear.
