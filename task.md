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

---
## 2026-04-25 13:18 — feature/auth-admin — Auth.js + shell do admin (F1)

**Fase:** F1
**PR:** em andamento (aberto contra `develop`)

### O que foi feito
- Instalado `next-auth@5.0.0-beta.31` (Auth.js v5).
- `src/lib/password.ts` com `hashPassword`/`verifyPassword` (wrappers de argon2id; `verifyPassword` retorna `false` em vez de propagar erro de hash inválido).
- `src/lib/auth.config.ts` (Edge-safe) define `pages.signIn`, `session.strategy = "jwt"`, callbacks `authorized` (redireciona `/admin/*` não autenticado para `/admin/login?callbackUrl=...`, redireciona `/admin/login` autenticado para `/admin`), `jwt`/`session` (carrega `id`/`email`).
- `src/lib/auth.ts` adiciona o Credentials provider que valida o body com Zod, busca o `AdminUser` (`select` explícito), confere a senha via `verifyPassword` e retorna `{ id, email }` (sem `passwordHash`).
- `src/app/api/auth/[...nextauth]/route.ts` re-exporta `handlers.GET`/`handlers.POST`.
- `src/middleware.ts` instancia `NextAuth(authConfig)` apenas com a config Edge-safe, com matcher `["/admin/:path*"]`.
- `/admin/login` (Server Component) renderiza um card com `<LoginForm/>` (client) usando shadcn form + `react-hook-form` + Zod (`loginSchema`). O submit chama um Server Action que executa `signIn("credentials", { email, password, redirectTo })`. Erros de `AuthError` (incl. `CredentialsSignin`) viram a mensagem genérica "Email ou senha inválidos" (toast `sonner`); `NEXT_REDIRECT` é re-throwed.
- `/admin` (Server Component) faz `auth()` na page e no layout `(dashboard)` (defesa em profundidade), mostra "Olá, Jorge" e 4 cards mocados (Total de cursos: 0, Alunos: 0, Certificados emitidos: 0, Receita: R$ 0,00).
- Layout `src/app/admin/(dashboard)/layout.tsx` com `<AdminSidebar/>` (links Dashboard / Cursos / Alunos + form com Server Action `signOutAction({ redirectTo: "/admin/login" })`).
- Stubs `/admin/cursos` e `/admin/alunos` ("Em construção — disponível na fase F2/F4") para os links da sidebar não 404.
- `scripts/admin-reset-password.ts` real: CLI tsx que pergunta email (default `ADMIN_SEED_EMAIL`), lê a nova senha duas vezes em raw mode (TTY) com mascaramento `*` e fallback texto visível com aviso quando stdin não é TTY; valida tamanho mínimo, confirmação e P2025 (admin não encontrado).
- `package.json`: `db:seed` e `admin:reset-password` agora rodam com `tsx --env-file=.env`; `pretest:e2e` faz `pnpm db:seed` antes da suite Playwright.
- Testes:
  - Unit (Vitest) cobrindo `verifyPassword` em 3 cenários (senha correta, senha errada, hash inválido).
  - E2E (Playwright) cobrindo: (a) login válido → `/admin` com "Olá, Jorge", (b) senha inválida → toast "Email ou senha inválidos" e permanência em `/admin/login`, (c) `/admin` sem sessão → redirect para `/admin/login`.
- `pnpm gates` verde; `pnpm test:e2e` verde (4 testes: 3 do login + 1 smoke).

### Arquivos tocados
- `package.json`, `pnpm-lock.yaml`, `task.md`
- `src/lib/{auth,auth.config,password}.ts`, `src/lib/validations/auth.ts`
- `src/middleware.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/admin/login/{page.tsx,login-form.tsx,actions.ts}`
- `src/app/admin/(dashboard)/{layout.tsx,page.tsx,actions.ts,cursos/page.tsx,alunos/page.tsx}`
- `src/components/admin/sidebar.tsx`
- `scripts/admin-reset-password.ts`
- `tests/unit/password.test.ts`, `tests/e2e/admin-login.spec.ts`

### Decisões
- **Split `auth.config.ts` (Edge) + `auth.ts` (Node).** É o pattern oficial de Auth.js v5 quando o provider tem dependências Node-only (Prisma + argon2). O middleware importa só `authConfig` para não puxar `db`/`argon2` no bundle Edge.
- **JWT em vez de DB session.** `session.strategy = "jwt"` evita criar tabela de sessões (que não está no SPEC) e mantém o middleware `authorized` consultando só o cookie. Quando precisar invalidar sessão por logout, o `signOut()` já faz.
- **Mensagem genérica em qualquer erro de credencial.** Tanto email inexistente quanto senha errada retornam `"Email ou senha inválidos"`. Auth.js encapsula isso via `CredentialsSignin`, mas garantimos que o `safeParse` falho (e qualquer outro `AuthError`) também caia na mesma string para não vazar enumeração.
- **Server Action chamando `signIn`.** Evita expor a senha em `fetch` cliente para `/api/auth/callback/credentials`. O Server Action recebe `FormData`, valida com Zod e chama `signIn` server-side; `redirectTo` é validado (precisa começar com `/admin`) para evitar open redirect via `callbackUrl`.
- **`pretest:e2e` rodando `pnpm db:seed`** (em vez de `globalSetup` do Playwright). É 1 linha em `package.json`, usa o mesmo path do dev/prod (idempotente via `upsert`) e dispensa um arquivo dedicado em `tests/e2e/`. O webServer do Playwright (`pnpm dev`) já carrega `.env` automaticamente; o seed precisava de `--env-file=.env` no `tsx` porque tsx não auto-carrega.
- **Senha mínima de 8 caracteres no reset CLI.** O SPEC não especifica, mas `31415926` (default do `.env`) tem 8 — fica como o mínimo padrão e não bloqueia o fluxo de troca.
- **`pnpm admin:reset-password` foi testado manualmente apenas via inspeção do código (não fui rodá-lo numa sessão de TTY interativa para não modificar a senha do admin no banco do Jorge).** O fluxo "trocar senha e relogar" do critério de aceite F1 fica para o Jorge validar quando achar oportuno; se quiser, eu rodo num run dedicado.

### Próximos passos (F2)
- Schema completo (`Course`, `Module`, `Lesson`, `Question`) + stubs (`Enrollment`, `LessonView`, `ExamAttempt`, `Payment`, `Certificate`); migration + seed com 1 curso de exemplo.
- `src/lib/r2.ts` + endpoint `POST /api/admin/r2/presign`; `src/lib/bunny.ts` + `POST /api/admin/bunny/create-video`.
- `/admin/cursos` (lista + CRUD), `/admin/cursos/[id]` (módulos + aulas + Tiptap + upload TUS).
- `/admin/cursos/[id]/questoes` (CRUD do banco).
- E2E: criar curso → módulo → aula (upload mockado) → questão → publicar.

### Blockers / pendências
- Credenciais de Bunny Stream e Cloudflare R2 (necessárias em F2 para upload real). Em dev pode-se mockar até o Jorge prover.
- Branch protection ainda dependente do passo do `SETUP.md` (não bloqueia F1, mas vale checar antes de mergear).
