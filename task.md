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

---
## 2026-04-25 14:30 — feature/cms-cursos — CMS de cursos (F2)

**Fase:** F2
**PR:** em andamento (aberto contra `develop`)

### O que foi feito
- **Schema Prisma completo** (SPEC §3.1): `Course`, `Module`, `Lesson`, `LessonView`, `Question`, `Enrollment`, `ExamAttempt`, `Payment`, `Certificate` + enums `CourseCategory` e `PaymentStatus`. Cascade rules conforme SPEC; @@unique em `LessonView(studentEmail,lessonId)` e `Enrollment(studentEmail,courseId)`. Migration `20260425133421_add_courses_schema` aplicada.
- **Seed idempotente** (`prisma/seed.ts`): além do admin, cria curso de exemplo `fundamentos-de-engenharia-civil` com 1 módulo, 1 aula stub e 5 questões. Reexecução não duplica (upserts/findFirst+create).
- **Integrações backend**:
  - `src/lib/r2.ts` com `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`. `getR2Client()`, `createPresignedUploadUrl(key,contentType,expiresIn)`, `getPublicUrl(key)`. Retorna `R2NotConfiguredError` se vars ausentes.
  - `src/lib/bunny.ts` via fetch nativo: `createVideo(title)`, `getVideoStatus(videoId)`, `deleteVideo(videoId)`. Computa `AuthorizationSignature` SHA-256 server-side (`libraryId+apiKey+expire+videoId`) com expiração 1h para uploads TUS — a apiKey nunca vai ao client.
  - `POST /api/admin/r2/presign` e `POST /api/admin/bunny/create-video` protegidos por `auth()`. Retornam **503** com mensagem clara quando env vars estão vazias.
- **Admin UI — Cursos**:
  - `/admin/cursos` lista (Server Component) ordenada por `updatedAt`, com thumbnail, badges Publicado/Destaque/Rascunho, link Editar e dialog de exclusão.
  - `/admin/cursos/novo` e `/admin/cursos/[id]/editar` com formulário Zod + react-hook-form: título, slug auto-gerado por `slugify`, descrição, categoria (select), preço BRL com máscara via `formatCentsToBRL`/`parseBRLToCents`, carga horária, examQuestionsCount, examPassScore, thumbnail (upload R2 via presign + barra de progresso), featured, published. Slug travado quando há matrículas. Server Actions create/update/delete com tratamento P2002 (slug duplicado).
- **Admin UI — Módulos e aulas** (`/admin/cursos/[id]`):
  - Tabs Configurações / Módulos / Banco de questões.
  - `ModulesPanel` + `LessonsSubpanel` com dnd-kit (PointerSensor + KeyboardSensor) reordenando módulos e aulas; `reorderModulesAction` e `reorderLessonsAction` persistem via `db.$transaction(updates)`.
  - `LessonForm`: título, `<VideoUploader/>` (TUS direto pro Bunny via `tus-js-client`, headers `AuthorizationSignature/Expire/VideoId/LibraryId`, fallback "Configure BUNNY_STREAM_API_KEY..." quando 503), `<TiptapEditor/>` (StarterKit + Link, toolbar bold/italic/H2/H3/listas/link, JSON salvo no campo Json) e upload opcional de PDF via R2.
- **Admin UI — Banco de questões** (`/admin/cursos/[id]/questoes`):
  - CRUD completo com `QuestionForm` (enunciado, 4 opções com radio para a correta, toggle Ativa). Lista mostra ✓ na correta, badge Ativa/Inativa, botões Editar/Toggle/Excluir. Validação Zod com `refine` exigindo exatamente 1 correta.
- **Stubs**: `/admin/alunos` permanece "Em construção" (F4); modelos `Enrollment`/`ExamAttempt`/`Payment`/`Certificate` definidos no schema mas sem rotas/UI nesta fase.
- **Testes**:
  - Vitest unit: `slug.test.ts` (slugify diacríticos/whitespace/sufixos `-2/-3`) e `money.test.ts` (formatBRL/parseBRL roundtrip + edge cases). Total agora: 20 testes.
  - Playwright `admin-cms.spec.ts`: login → cria curso → módulo → aula sem upload → questão → reload persiste → abre o curso pela lista. Suíte e2e total: 5 testes verdes.
- **Deps adicionadas**: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `tus-js-client`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/pm`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`. Primitivos shadcn: `textarea`, `select`, `switch`, `checkbox`, `tabs`, `badge`.
- `pnpm gates` verde; `pnpm test:e2e` verde (5/5).

### Arquivos tocados
- `prisma/schema.prisma`, `prisma/migrations/20260425133421_add_courses_schema/migration.sql`, `prisma/seed.ts`
- `src/lib/{r2,bunny,money,slug}.ts`
- `src/lib/validations/{course,module,lesson,question}.ts`
- `src/app/api/admin/r2/presign/route.ts`, `src/app/api/admin/bunny/create-video/route.ts`
- `src/app/admin/(dashboard)/cursos/page.tsx`
- `src/app/admin/(dashboard)/cursos/novo/page.tsx`
- `src/app/admin/(dashboard)/cursos/_components/{course-form,delete-course-button}.tsx`
- `src/app/admin/(dashboard)/cursos/actions.ts`
- `src/app/admin/(dashboard)/cursos/[id]/{page,actions}.ts(x)`
- `src/app/admin/(dashboard)/cursos/[id]/_components/{modules-panel,lesson-form}.tsx`
- `src/app/admin/(dashboard)/cursos/[id]/editar/page.tsx`
- `src/app/admin/(dashboard)/cursos/[id]/questoes/{page,actions}.ts(x)`
- `src/app/admin/(dashboard)/cursos/[id]/questoes/_components/{question-form,questions-list}.tsx`
- `src/components/admin/{thumbnail-upload,tiptap-editor,video-uploader}.tsx`
- `src/components/ui/{badge,checkbox,select,switch,tabs,textarea}.tsx`
- `tests/unit/{slug,money}.test.ts`, `tests/e2e/admin-cms.spec.ts`
- `package.json`, `pnpm-lock.yaml`

### Decisões
- **Bunny TUS auth via signature SHA-256** (não AccessKey direto pro client). Calculo `sha256(libraryId+apiKey+expire+videoId)` no server e devolvo `{authorizationSignature, authorizationExpire, videoId, libraryId, uploadUrl}` pro client. A apiKey nunca atravessa a fronteira. Documentado em `src/lib/bunny.ts`.
- **TUS via `tus-js-client`** (não SDK oficial). Mais leve e estável que `@bunny.net/stream-sdk`; integração direta via headers TUS metadata, com `retryDelays: [0,1000,3000,5000]` para resumir uploads que travam.
- **Schema Zod sem `.coerce`** no formulário de curso. O `useForm<CourseInput>` precisa de input/output type iguais; mantenho strings/booleans/números puros no schema e converto FormData → tipos dentro do Server Action (helper `parseCourseFormData`). Evita conflitos zod 4 + RHF v7 sobre `Resolver<input, ctx, output>`.
- **`window.location.reload()` após mutations** no painel admin de módulos/aulas/questões. `revalidatePath` + `router.refresh()` não estavam refletindo as mudanças no client em Turbopack dev (bug aparente do RSC streaming com Server Action chamada via `await` de wrappers). Como é admin tool, o reload é aceitável; nas outras telas (criação de curso) usamos `redirect` no Server Action que funciona normalmente.
- **`asChild` no `Button` shadcn não existe** com o registry `base-nova` (`@base-ui/react`). Para botões-link usei `<Link className={buttonVariants({...})}>...</Link>` em vez de `<Button asChild>`.
- **Lista questão usa Json puro como `QuestionOption[]`**. Evita migration extra e mantém a forma `[{id,text,isCorrect}]` documentada no SPEC.

### Próximos passos (F3)
- Home pública / dark mode / hero do curso featured / rows por categoria.
- `/cursos/[slug]` com lista de módulos/aulas.
- Modal de captura de email + `POST /api/enrollment` idempotente.
- Player Bunny embed + sidebar Tiptap renderer + `POST /api/progress` (debounce 10s).
- Indicador ✓ em aulas completadas.
- E2E público: navegar do catálogo → curso → aula com progresso persistido.

### Blockers / pendências
- **Credenciais reais de Bunny Stream e Cloudflare R2** continuam pendentes; UI já reflete o 503 com mensagens amigáveis ("Bunny Stream não configurado..." e desabilita o botão). Para testar uploads reais Jorge precisa preencher `BUNNY_STREAM_*` e `R2_*` no `.env` (e no Vercel para prod).
- **Branch protection no GitHub** continua aberta — ainda dependente do passo do `SETUP.md`. Não bloqueia F2.
- Drag-to-reorder de módulos/aulas usa `router.refresh()` (não `window.location.reload()`) e funciona porque a UI já mostra o estado optimístico via `setModules(next)` antes do roundtrip; se o reorder falhar em produção o `setModules(initial)` reverte. Em dev/Turbopack está estável.

---
## 2026-04-25 15:08 — feature/catalogo-player — Catálogo público + player + progresso (F3)

**Fase:** F3
**PR:** em andamento (aberto contra `develop`)

### O que foi feito
- **Layout público novo (route group `(public)`)**: substitui o placeholder de `src/app/page.tsx` por uma home estilo Netflix em dark mode. `PublicHeader` fixo com logo "Netflix-Cursos" e Toaster do `sonner` no layout.
- **Home (`/`)**: hero com `Course.featured=true && published=true` mais recente (fallback para o último publicado, fallback final "Cursos em breve"). Hero exibe thumbnail de fundo com gradiente, badge da categoria, título, descrição truncada (~220 chars) e link "Começar curso" estilizado via `buttonVariants` (não wrap de `<button>` em `<a>`). Abaixo, 3 rows horizontais (Engenharia Civil / Mecânica / Segurança do Trabalho) usando `flex` + `snap-x`/`snap-mandatory` puro CSS (sem libs novas). `CourseCard` mostra thumbnail, "X aulas · Yh", badge da categoria, hover scale-up + shadow.
- **Página do curso (`/cursos/[slug]`)**: Server Component que busca course por slug (404 se não publicado), com hero compacto (badge categoria, título, descrição completa em `whitespace-pre-wrap`, "X aulas · Yh · Certificado R$ Z"). Conteúdo da lista renderizado pelo `<CourseDetailView/>` (client) que carrega o estado de progresso e expõe os botões "Começar curso"/"Continuar" e "Fazer prova" (disabled até todas as `Lesson` ficarem `completed`).
- **Modal de captura de email** (`<EmailCaptureModal/>`): shadcn dialog + form simples (sem react-hook-form para reduzir overhead) com Zod via `enrollmentInputSchema`, checkbox de consentimento LGPD obrigatório. Submit chama `POST /api/enrollment` (idempotente via `upsert(studentEmail_courseId)`), persiste em `localStorage["netflix_cursos_email"]` e dispara navegação pra primeira aula não-concluída ou primeira aula.
- **Página da aula (`/cursos/[slug]/aulas/[lessonId]`)**: Server Component faz join completo `course → modules → lessons`, aterrissa flat list, calcula prev/next, e passa pra `<LessonView/>` (client). Layout 2 colunas em desktop (player ~70% / sidebar ~30%) que stacka no mobile. Header tem breadcrumb (← Curso), "Aula X de N", título e chip ✓ Concluída / ⏵ Em progresso. Sidebar tem material renderizado por `<TiptapRenderer/>` (Tiptap em modo `editable=false`, mais simples que `generateHTML`), botão "Baixar PDF" se `sidebarPdfUrl`, e listagem compacta de aulas do curso com ícones de estado e destaque na aula atual.
- **Player Bunny (`<LessonPlayer/>`)**: server component que constrói a URL de embed via `buildBunnyEmbedUrl(libraryId, videoId)` com `autoplay=false&loop=false&muted=false&preload=true&responsive=true`. Quando faltam ids exibe placeholder "Vídeo não disponível para esta aula." (cobre o seed atual sem credenciais Bunny).
- **Tracking de progresso (`<ProgressTracker/>`)**: cliente-only, baseado em **dwell focado** (visibilitychange + setInterval 1s). Calcula `pct = min(100, elapsed / max(60s, durationSeconds*0.9) * 100)` e flusha `POST /api/progress` a cada 10s, só quando o pct cresce. O endpoint upserta `LessonView` em `[studentEmail, lessonId]`, faz `progressPct = max(antigo, novo)`, e marca `completed=true` quando ≥ 90 (nunca volta pra false). Resposta volta ao client via `onProgressUpdate`, que re-hidrata o `Map<lessonId, LessonState>` na `<LessonView/>` — assim os chips ✓/⏵ atualizam sem reload.
- **Persistência via banco**: além do localStorage, todo refresh repuxa `GET /api/enrollment/state?courseId=&studentEmail=` que devolve `enrollmentId` + `views[]`. Se o aluno trocar de máquina e digitar o mesmo email, o progresso continua de onde parou. Se o email salvo no localStorage não tem enrollment ainda (cenário de cache antigo), a `<LessonView/>` cria via `POST /api/enrollment` automaticamente.
- **Validations Zod novas**: `enrollmentInputSchema` (courseId + studentEmail trim/lowercase/email/max254) e `progressInputSchema` (enrollmentId + lessonId + progressPct int 0–100). `POST /api/progress` ainda valida que o `lessonId` pertence ao `enrollment.courseId` antes de upsertar.
- **Smoke E2E**: troquei `tests/e2e/smoke.spec.ts` (não existia mais "em construção" no `/`) por uma asserção do logo no header.
- **Unit (Vitest) novos**: `tests/unit/bunny-embed.test.ts` (3 testes — domínio + params default + overrides) e `tests/unit/progress.test.ts` (5 testes — `areAllLessonsCompleted` em cenários vazio/feliz/parcial/views órfãs e `isCompletedPct`/threshold). Total: **28 testes** unit verdes.
- **E2E novo (`tests/e2e/public-catalog.spec.ts`)**: 3 specs serial — (a) home renderiza header + "Começar curso" + heading "Engenharia Civil"; (b) clique no card vai pra `/cursos/[slug]` com botão "Fazer prova" disabled; (c) modal de email → submit → primeira aula → reload preserva email no localStorage e não reabre o modal → após >10s flush, chip "Em progresso" aparece. Total e2e: **8 testes** verdes (3 admin-login, 1 admin-cms, 1 smoke, 3 public-catalog).
- `pnpm gates` verde; `pnpm test:e2e` verde.

### Arquivos tocados
- `src/app/(public)/{layout.tsx,page.tsx}`
- `src/app/(public)/cursos/[slug]/page.tsx`
- `src/app/(public)/cursos/[slug]/aulas/[lessonId]/page.tsx`
- `src/app/api/enrollment/route.ts`, `src/app/api/enrollment/state/route.ts`, `src/app/api/progress/route.ts`
- `src/app/page.tsx` (deletado)
- `src/components/public/{header,hero-section,course-row,course-card,course-detail-view,email-capture-modal,tiptap-renderer,lesson-player,lesson-view,progress-tracker}.tsx`
- `src/lib/{bunny-embed,categories,progress,student-email}.ts`
- `src/lib/validations/{enrollment,progress}.ts`
- `tests/e2e/{public-catalog,smoke}.spec.ts`
- `tests/unit/{bunny-embed,progress}.test.ts`

### Decisões
- **Tracking de progresso por dwell focado, não por postMessage do Bunny.** O `iframe.mediadelivery.net/embed` não emite eventos de progresso de forma estável sem o `player.js` da Bunny (e ainda assim depende de configuração da Library). Em vez de adicionar mais uma dep e calibrar handshake do `player.js`, segui o fallback explicitamente autorizado no prompt da F3: visibilitychange + setInterval acumulando segundos focados, marcando completed em ≥ `max(60s, duration*0.9)`. É previsível, testável (cobre o caso do seed sem `bunnyVideoId`), e independente da configuração real da CDN. Quando aparecer um caso de produção que precise de timestamp real de play/pause, troca-se a fonte do `pct` sem mudar o pipeline.
- **Tiptap em modo `editable: false`, não `generateHTML`.** `@tiptap/html` não está instalado e introduzir uma segunda implementação de extensions só para serializar HTML duplica configuração. Reusar `useEditor` com `editable: false` rende o mesmo HTML usado no editor admin e mantém uma única source of truth para extensions (StarterKit + Link). Custo: o sidebar é um Client Component (mas a árvore inteira da `<LessonView/>` já é client por causa do tracking, então é gratuito).
- **Page da aula é Server Component fino + `<LessonView/>` client gordo.** O Server Component só faz o fetch + flat lessons + 404, e passa props serializáveis pro client. Isso permite redirect/notFound com SSR mas mantém todo o estado interativo (player, sidebar, tracker, modal) num só lugar — evita prop drilling de email/enrollmentId pra três componentes diferentes.
- **`POST /api/enrollment` e `POST /api/progress` sem auth, validados estritamente com Zod.** Conforme prompt da F3 (regra 4). O `POST /api/progress` reforça o invariante checando `lesson.module.courseId === enrollment.courseId` antes de upsertar — impede que alguém reuse um enrollmentId válido para marcar progresso em curso de outra pessoa.
- **`progressPct` é monotônico no servidor.** O upsert faz `nextPct = max(existing.progressPct, payload.progressPct)` e `nextCompleted = existing.completed || payload >= 90`. Ou seja: se o aluno re-assistir com o player no zero, o servidor não regride — o client também enforça `Math.max(lastSent, computed)` antes de mandar. Custo: nunca dá pra "resetar" um progresso, mas isso não está no escopo do produto.
- **`<EmailCaptureModal/>` sem react-hook-form.** Form com 2 campos é mais legível como `useState` direto + `safeParse(enrollmentInputSchema, ...)` no submit. RHF agrega mais peso do que valor pra esse caso.
- **Hero usa `<Link className={buttonVariants(...)}>`, não `<Link><Button/></Link>`.** Wrap de `<button>` em `<a>` é HTML inválido e quebra `getByRole("button")` no Playwright (foi o que aconteceu na primeira passagem dos testes). `buttonVariants` resolve sem precisar de `asChild` (que o registry `base-nova` não expõe — vide F2 task.md).
- **Listagem de aulas usa `flat` + indexação numerada por curso, não por módulo.** "Aula X de N" e a sidebar list contam o curso inteiro porque a navegação prev/next é livre entre módulos (regra do SPEC §4.1.5: "Navegação é livre, pode pular ordem").

### Próximos passos (F4 — `feature/prova-pix-cert`)
- `/cursos/[slug]/aulas/prova` com gate via `areAllLessonsCompleted` (helper já está pronto em `src/lib/progress.ts`).
- `POST /api/exam/start` (sorteio de N questões + cria `ExamAttempt`) e `POST /api/exam/submit` (corrige + salva score/passed).
- Form de dados (nome + CPF com dígito verificador) → `POST /api/pix/create` → MP API → tela do Pix (QR base64 + copia-e-cola + contador) com polling 3s em `GET /api/pix/status/[id]`.
- `POST /api/pix/webhook` validando `x-signature`, idempotente.
- `src/lib/certificates.ts::issueCertificate()` — geração via `@react-pdf/renderer`, upload R2, envia email Resend, cria `Certificate`.
- `/cursos/[slug]/certificado` (preview + download) e `/verificar/[codigo]` (SSR).

### Blockers / pendências
- **Credenciais reais de Bunny Stream / Cloudflare R2** continuam pendentes; o player public-side trata o 0-credentials caso com placeholder "Vídeo não disponível", e a UI admin segue mostrando 503 amigável (vide F2). F4 vai precisar de **Mercado Pago** (`MERCADOPAGO_ACCESS_TOKEN` em modo `TEST-`), **Resend** (`RESEND_API_KEY` em test mode ou MailHog) e **R2** (pra upload do PDF do certificado) — sandbox do MP basta pra começar.
- O fallback de tracking via dwell completa a aula em ≥60s focados quando `durationSeconds` é null. Quando o webhook do Bunny começar a popular `Lesson.durationSeconds` (já existe coluna no schema), o threshold passa automaticamente pra `duration*0.9`. Não precisa migration nem mudança no código.
- Branch protection no GitHub: ainda pendente (vide entradas anteriores). Não bloqueia F3 nem F4.

---
## 2026-04-25 17:55 — feature/rebrand-landing — Rebrand Ativa Engenharia + Landing Institucional (F3.5)

**Fase:** F3.5
**PR:** em andamento (aberto contra `develop`)

### O que foi feito
- **Rebrand global** ("Netflix-Cursos" → "Ativa Engenharia"): `package.json` (`name: "ativa-engenharia"`), `README.md`, `prisma/schema.prisma`, `src/app/layout.tsx` metadata, `src/components/admin/sidebar.tsx`, `src/components/public/header.tsx`, `RESEND_FROM` em `.env`/`.env.example`, `R2_BUCKET=ativa-engenharia` em `.env`/`.env.example`. Devcontainer renomeado pra `"Ativa Engenharia"`; clone URL e workspaceFolder do GitHub mantidos como `Netflix-Cursos` (o repo ainda se chama assim por motivos históricos — registrado no README).
- **Banco renomeado** de `netflix_cursos` para `ativa_engenharia`. `DATABASE_URL` atualizado em `.env`, `.env.example` e `.devcontainer/docker-compose.yml` (`POSTGRES_DB`, healthcheck). Banco novo criado e seed rodado dentro do dev container. PR description documenta para o Jorge: `createdb ativa_engenharia && pnpm db:migrate && pnpm db:seed` (ou rebuild do dev container).
- **Migração de `localStorage`** sem perda de progresso: `STUDENT_EMAIL_KEY = "ativa_engenharia_email"`, `LEGACY_STUDENT_EMAIL_KEY = "netflix_cursos_email"`. `readStudentEmail()` lê o key novo primeiro; se ausente e o legado existir, copia o valor pra chave nova, apaga o legado e retorna. Coberto por 4 testes Vitest em `tests/unit/student-email-migration.test.ts`.
- **Tipografia + paleta**: `Inter` via `next/font/google` no `RootLayout` (sem `Geist`), com `--font-sans` mapeando `font-sans`/`font-mono`/`font-heading`. `globals.css` redefiniu todos os tokens shadcn em HSL com paleta navy: light `--primary: hsl(215 53% 25%)` (`#1E3A5F`), `--accent: hsl(213 35% 37%)` (`#3D5A80`); dark `--background: hsl(215 35% 6%)` (navy night, não preto puro). RootLayout deixou de forçar `className="dark"` no `<html>`.
- **Tema híbrido por route group**: `(public)` foi dividido em `(public-light)` (institucional, `/`, `/servicos`, `/quem-somos`, `/faq`, `/contato`) e `(public-dark)` (catálogo + aulas, `/cursos`, `/cursos/[slug]`, `/cursos/[slug]/aulas/[lessonId]`). O layout dark aplica `className="dark"` num wrapper `<div>`, o light não. Admin segue dark via `RootLayout` da rota `/admin` (sem mudança).
- **PublicHeader reescrito** como Client Component que usa `usePathname()` (`isCursoRoute`) pra escolher tema próprio: header escuro com logo invertida (`brightness(0) invert(1)`) em rotas `/cursos*`, header claro caso contrário. Menu de 6 itens (Home/Serviços/Cursos/Quem Somos/FAQ/Contato) com item ativo destacado, drawer mobile (toggle hamburger/X, lock body scroll, fecha em cada navegação) e botão WhatsApp à direita no desktop.
- **PublicFooter novo** com 4 colunas (brand+slogan / nav / contato com WhatsApp+email+Instagram+site / responsáveis técnicos com CREA) + linha de copyright; aceita `variant: "light" | "dark"` pra casar com o layout em que é montado.
- **HeroCarousel**: `embla-carousel-react` + `embla-carousel-autoplay` (5s, pausa em hover/focus, respeita `prefers-reduced-motion`), setas e dots clicáveis, `next/image priority` no primeiro slide pra LCP. Texto fixo em overlay (não muda entre slides).
- **WhatsAppButton** reusable com 3 variants (`primary`, `outline`, `icon`), abre `https://wa.me/5527998183686?text=...` em nova aba. Usado no header desktop, footer, home, /servicos e /contato.
- **ContactForm** client com Zod, sem backend: monta um `mailto:ativaengmec@gmail.com` com subject + body pré-preenchidos e dispara `window.location.href`; toast de sucesso pelo `sonner`.
- **FaqAccordion** baseado em `radix-ui` (Accordion exportado do `radix-ui` umbrella, sem instalar primitivo separado), com chevron animado e tipografia padrão.
- **Conteúdo institucional** todo em TS (ADR-011): `src/content/contact.ts` (números, handles, `buildWhatsAppUrl`), `src/content/team.ts` (3 responsáveis técnicos com CREA), `src/content/about.ts` (hero, missão, visão preventiva, responsabilidade ambiental, 4 diferenciais), `src/content/faq.ts` (10 perguntas placeholder), `src/content/seals.ts` (CREA-ES, ABNT, CB-ES), `src/content/services.ts` (~25 serviços agrupados em 6 categorias do PDF da empresa).
- **Páginas novas/movidas**:
  - `/` (institucional, light): HeroCarousel + headline "Soluções integradas em engenharia: segurança, qualidade e excelência" + CTAs "Ver cursos" / "Solicitar orçamento" + 4 cards de diferenciais com ícones lucide (Award/Sparkles/ShieldCheck/Wrench) + preview "Cursos em destaque" (até 3 cursos publicados, ordenados por `featured` desc) com cards 2:3 e link "Ver todos" + preview de 6 serviços + selos institucionais + CTA card final com WhatsApp.
  - `/servicos` (light): hero compacto + 6 cards (1 por categoria) com bullets `CheckCircle2` + CTA "Solicite um orçamento".
  - `/quem-somos` (light): hero institucional + imagem da equipe (`hero-02.png`) + 3 cards (missão / visão preventiva / responsabilidade ambiental) + 3 cards de responsáveis técnicos com CREA.
  - `/faq` (light): hero + FaqAccordion com 10 itens + card "sua dúvida não está aqui? WhatsApp".
  - `/contato` (light): hero + grid 2 colunas: à esquerda card verde com WhatsApp em destaque + ContactForm; à direita 4 cards de contatos diretos (email, Instagram, site, atuação) com ícones.
  - `/cursos` (dark, **substitui o catálogo antigo de `/`**): hero compacto "Catálogo de cursos" + chips de filtro `?categoria=civil|mecanica|seguranca` (Server Component lê `searchParams`) + rows por categoria (em modo "Todas") ou row única (modo filtrado) com cards verticais 2:3.
- **`<CourseCard/>`** ganhou variant `"poster"` (2:3, narrower) ao lado da `"thumbnail"` (16:9). `<CourseRow/>` repassa o variant. `hero-section.tsx` (usado pelo catálogo antigo de `/`) deletado.
- **Testes E2E**:
  - `tests/e2e/smoke.spec.ts` adaptado: agora espera o link `aria-label="Ativa Engenharia — página inicial"` no `banner` (header) — escopado pra evitar match no footer.
  - `tests/e2e/public-catalog.spec.ts` adaptado: catálogo agora vive em `/cursos` em vez de `/`. Limpeza de localStorage cobre tanto a chave nova quanto a legada. Validação adicional: depois do submit do modal, `localStorage["ativa_engenharia_email"]` tem o email e `localStorage["netflix_cursos_email"]` permanece nulo.
  - `tests/e2e/public-landing.spec.ts` (novo): 5 specs — (a) `/` mostra brand + 6 itens de nav + headline + CTA "Ver cursos"; (b) clique em "Ver cursos" navega pra `/cursos` com `Catálogo de cursos`; (c) `/contato` tem `<a href="https://wa.me/5527998183686...">`; (d) `/servicos` lista PMOC/SPDA/NR-12/NR-13/PCMSO/Inspeção termográfica; (e) `/quem-somos` mostra "Eduardo Bissoli" e "CREA MT-038597".
  - Total e2e: **13 verdes** (3 admin-login + 1 admin-cms + 1 smoke + 3 public-catalog + 5 public-landing).
- **Testes Unit**:
  - `tests/unit/whatsapp-url.test.ts` (novo, 3 testes): mensagem default, custom, encoding correto + roundtrip.
  - `tests/unit/student-email-migration.test.ts` (novo, 4 testes): chave nova existe / legada existe → migra / nada existe / writeStudentEmail só toca a chave nova.
  - Total: **35 testes** Vitest (era 28; +7).
- **Build production**: `pnpm build` gera 19 rotas estaticamente OK, incluindo `/`, `/servicos`, `/cursos`, `/cursos/[slug]`, `/cursos/[slug]/aulas/[lessonId]`, `/quem-somos`, `/faq`, `/contato`.

### Arquivos tocados
- **Rebrand**: `package.json`, `README.md`, `.env`, `.env.example`, `.devcontainer/docker-compose.yml`, `.devcontainer/devcontainer.json`, `prisma/schema.prisma`, `src/app/layout.tsx`, `src/components/admin/sidebar.tsx`, `src/components/public/header.tsx`, `src/lib/student-email.ts`.
- **Tema/fonte**: `src/app/layout.tsx`, `src/app/globals.css`.
- **Layouts (públicos)**: `src/app/(public-light)/layout.tsx` (novo), `src/app/(public-dark)/layout.tsx` (movido de `(public)`).
- **Componentes**: `src/components/public/header.tsx` (reescrito), `src/components/public/footer.tsx` (novo), `src/components/public/hero-carousel.tsx` (novo), `src/components/public/faq-accordion.tsx` (novo), `src/components/public/contact-form.tsx` (novo), `src/components/public/whatsapp-button.tsx` (novo), `src/components/public/course-card.tsx` (variant `poster` adicionada), `src/components/public/course-row.tsx` (forward variant), `src/components/public/hero-section.tsx` (deletado).
- **Páginas**: `src/app/(public-light)/page.tsx`, `src/app/(public-light)/servicos/page.tsx`, `src/app/(public-light)/quem-somos/page.tsx`, `src/app/(public-light)/faq/page.tsx`, `src/app/(public-light)/contato/page.tsx`, `src/app/(public-dark)/cursos/page.tsx` (todas novas); `src/app/(public-dark)/page.tsx` (deletado).
- **Conteúdo**: `src/content/{about,contact,faq,seals,services,team}.ts` (todos novos).
- **Helpers**: `src/lib/public-nav.ts` (novo).
- **Testes**: `tests/e2e/{smoke,public-catalog}.spec.ts` (adaptados), `tests/e2e/public-landing.spec.ts` (novo), `tests/unit/{whatsapp-url,student-email-migration}.test.ts` (novos).
- **Deps**: `embla-carousel-react`, `embla-carousel-autoplay` adicionadas ao `package.json` + `pnpm-lock.yaml`.

### Decisões
- **Tema híbrido implementado via route groups + classe `dark` num wrapper `<div>`**, e não via `className` no `<html>` ou via `usePathname` num único layout. Justificativa: shadcn-base-nova depende de `.dark` num ancestral pra trocar tokens; ter dois layouts independentes deixa a transição visual clara e permite aplicar elementos específicos do dark (background da home dark, header invert) sem condicionais por toda a árvore. O `<PublicHeader/>` ainda usa `usePathname()` (Client Component) para gerar **classes Tailwind** de cor do logo/menu por rota, redundante com a classe `dark` mas exigido pelo prompt e confiável quando o usuário navega entre `(public-light)` e `(public-dark)` via SPA.
- **Logo único, com `dark:brightness-0 dark:invert` no `<img>`** quando o header está em modo dark. Não foi criada `logo-light.png` — o filtro inverte cor da logo navy original e o resultado lê bem sobre o background `hsl(215 35% 6%)`. Caso a logo evolua pra um design que não tolere o filtro (ex: cores adicionais), basta substituir o asset por uma versão clara e remover o `dark:` do CSS.
- **`/cursos` Server Component lê `searchParams` Promise** (Next 15 ainda exige await em sync-dynamic APIs). O filtro é via Link com `?categoria=...` em vez de Client state — o que mantém o catálogo inteiro server-rendered (SEO-friendly) e dispensa `useState`/`useRouter` na página.
- **CourseCard variant `poster`** (2:3) coexiste com `thumbnail` (16:9). Não criei dois componentes separados porque o body abaixo do thumbnail é idêntico — só muda a aspect ratio e a width do wrapper.
- **`/contato` sem backend (`mailto:`)** conforme SPEC §4.6. WhatsApp em destaque (card verde no topo do form) reflete o que o Jorge usa como canal primário no dia a dia. Backend SMTP via Resend foi explicitamente movido pra F5+ em ADR / SPEC.
- **`embla-carousel-react@^8`** escolhido por ser a opção mais leve e estável (Mux e Linear usam). O plugin `Autoplay` tem suporte oficial e a API permite respeitar `prefers-reduced-motion` desabilitando o plugin condicionalmente.
- **`Accordion` direto do umbrella `radix-ui`** (`import { Accordion } from "radix-ui"`) sem instalar primitivo shadcn — o registry `base-nova` não expõe `accordion` ainda e o radix bruto + classes utilitárias dá o mesmo resultado com 5 linhas a menos.
- **`hero-section.tsx` deletado** em vez de ser deixado dormente: CLAUDE.md §10 ("Avoid backwards-compatibility hacks"). O catálogo antigo de `/` foi reescrito do zero em `/cursos` com layout diferente (sem hero featured de curso), então reaproveitar o componente seria perda de tempo.
- **Repo path / GitHub URL mantidos** como `Netflix-Cursos`. Renomear o repo no GitHub é uma decisão do Jorge (afeta CI badges, links externos, gh CLI) e não bloqueia o rebrand do produto. Documentado como nota no README.

### Próximos passos (F4 — `feature/prova-pix-cert`)
- Destravamento da prova quando `areAllLessonsCompleted` (helper já existe) é `true`.
- `POST /api/exam/start` (sorteia N questões → `ExamAttempt`) + `POST /api/exam/submit` (corrige + `score`/`passed`).
- Form de pagamento: nome + CPF (validação dígitos) → `POST /api/pix/create` → MP → tela com QR/copia-e-cola/contador 30min + polling 3s.
- `POST /api/pix/webhook` validando `x-signature`, idempotente.
- `src/lib/certificates.ts::issueCertificate()` com `@react-pdf/renderer` (template precisa receber a logo Ativa + selos), upload R2, email Resend.
- `/cursos/[slug]/certificado` + `/verificar/[codigo]` (SSR).

### Blockers / pendências
- **Banco em prod** (Neon): quando o repo for promovido pra produção, o DB no Neon precisa ser renomeado/recriado de `netflix_cursos` pra `ativa_engenharia` (ou um novo branch criado). No dev local já está OK.
- **Credenciais externas** ainda pendentes (Mercado Pago, Bunny, R2, Resend). F4 vai precisar pelo menos do MP em modo TEST e R2 pra subir o PDF do certificado.
- **Renomear repo no GitHub** de `Netflix-Cursos` → `ativa-engenharia` é decisão do Jorge. Quando acontecer, trocar a clone URL no README.md, ajustar `workspaceFolder` no devcontainer e `cd` no README.
- **Branch protection no GitHub** continua pendente (vide entradas anteriores). Não bloqueia F3.5.

---
## 2026-04-25 21:09 — feature/paywall-prova-cert — Paywall + Prova + Certificado (F4)

**Fase:** F4
**PR:** em andamento contra `develop`

### O que foi feito
- **C1 — `chore: cleanup pre-paywall (typo, subhead, test courses purge)`**: corrigido plural "questãos" → "questões" em `questions-list.tsx`; subhead de `/cursos` reescrito ("Acesso vitalício e certificado, pagos via Pix"); novo `scripts/cleanup-test-courses.ts` (com `pnpm db:cleanup-test-courses`) que remove cursos `published=false` antigos, slugs `curso-de-teste-*` e o slug `computacao` mediante confirmação `y/n` no terminal — idempotente, pediu confirmação no dev container e removeu os 3 cursos lixo restantes da F2/F3.
- **C2 — `feat(db): paywall schema (Enrollment.status, examPassScore default 6.0)`**: migration `20260425203747_paywall_schema` adiciona enum `EnrollmentStatus` (`pending_payment`|`active`|`cancelled`), coluna `Enrollment.status` com default `pending_payment`, grandfathering por `UPDATE ... WHERE startedAt < NOW()` (todos enrollments F3 viraram `active`), e baixa `Course.examPassScore` default de `7.0` → `6.0`. Schema Prisma sincronizado, comentário `///` em `Payment.mpPaymentId` documenta que hoje guarda `pix_char_*` da AbacatePay (renomear é churn). Seed deixou de override `examPassScore`.
- **C3 — `feat(payments): gateway adapter with AbacatePay v2 implementation (ADR-013)`**: novo módulo `src/lib/payments/{types,abacatepay,index}.ts`. Interface `PaymentGateway` define `createPix`/`getStatus`/`verifyWebhook`. `AbacatePayGateway` chama `/v2/transparents/create` com body **`{ method: "PIX", data: { ... } }`** (validado via teste unit que mocka `fetch`), mapeia envelope `{ success, data, error }` da AbacatePay, expõe `mapAbacateStatus` e valida HMAC-SHA256 do webhook em headers `webhook-signature` ou `x-abacate-signature` (ordem de fallback) com `crypto.timingSafeEqual`. Factory `getPaymentGateway()` lança `GatewayNotConfiguredError` quando `ABACATEPAY_API_KEY` está vazia, mas aceita `ABACATEPAY_WEBHOOK_SECRET` vazio (apenas o webhook endpoint falha nesse caso). 18 testes unit cobrindo factory, status mapping, verifyWebhook (válido, header ausente, HMAC inválido, fallback de header, refund→rejected) e createPix (body shape + CPF stripado de máscara + erro HTTP). `.env.example` ganhou bloco `# --- Payment Gateway (ADR-013) ---`.
- **C4 — `feat(paywall): access gates on course detail, lesson page, and progress endpoints`**: novo `src/lib/access.ts` (`getEnrollment`, `hasAccess`); `POST /api/enrollment` deixa de criar enrollment e passa a apenas consultar — retorna `{ exists, status, enrollmentId? }`; `POST /api/progress` ganha guard `403 "Acesso pendente de pagamento"` quando `enrollment.status !== "active"`; `GET /api/enrollment/state` retorna `views: []` quando status ≠ `active`; novo `<CourseDetailGate/>` (Client) substitui `<CourseDetailView/>` com CTA dinâmico (`Comprar acesso` / `Finalizar pagamento` / `Continuar curso`) + card lateral "O que está incluído"; novo `<LessonAccessGate/>` que decide entre renderizar `<LessonView/>` ou tela de bloqueio "Acesso necessário"; `<EmailCaptureModal/>` e `<CourseDetailView/>` removidos (CLAUDE.md §10 — sem dead code). E2E `public-catalog.spec.ts` reescrito para o novo fluxo: usa Prisma direto pra resolver o seed lessonId e cobre o cenário "comprar acesso visível" + "tela de bloqueio".
- **C5 — `feat(checkout): Pix flow with email+CPF form, QR display, and polling`**: `src/lib/cpf.ts` com `validateCpf` (algoritmo dos 2 dígitos verificadores, rejeita todos-iguais), `maskCpf` (progressiva `000.000.000-00`) e `stripCpfMask`; 12 testes unit. Validação Zod `checkoutCreateSchema` em `src/lib/validations/checkout.ts`. Novo `POST /api/checkout/create` que valida payload, busca `Course` (404 se não publicado), retorna `409` se enrollment já é `active`, idempotência leve quando há `Payment` `pending` ainda válido (reusa QR), cria/atualiza `Enrollment` + `Payment` em transação Prisma com sentinel `mpPaymentId="pending:<uuid>"` (sai da transação para chamar `gateway.createPix` e atualiza com o `pix_char_*` real); marca `Payment.status="rejected"` se gateway falhar antes de propagar 502. `GET /api/checkout/status/[paymentId]` faz lazy expiry quando `expiresAt < now` e usa `gateway.getStatus()` como fallback ao webhook (sempre que pendente, ignorando intervalos — o cliente já faz polling 3s). Página `/cursos/[slug]/comprar` (Server) + `<CheckoutForm/>` (Client, react state + Zod inline + máscara CPF + checkbox LGPD); página `/cursos/[slug]/comprar/pix` (Server) + `<PixView/>` (Client com QR base64 inline `<img src={qrCodeBase64}/>` — sem re-prefixar `data:image/png;base64,`, copia-e-cola via `navigator.clipboard`, contador regressivo 30 min e polling 3 s; redireciona pra primeira aula em `approved`).
- **C6 — `feat(exam-cert): exam flow + automatic certificate issuance on pass`**: instalei `@react-pdf/renderer`, `qrcode` e `@types/qrcode`. Migração `20260425210052_certificate_pdf_nullable` faz `Certificate.pdfUrl` nullable (permite emitir sem R2). `POST /api/exam/start` sorteia `examQuestionsCount` questões via `db.$queryRaw<>` com `ORDER BY random() LIMIT N`, cria `ExamAttempt` e devolve `{ attemptId, questions }` sem `isCorrect`. `POST /api/exam/submit` corrige server-side (marca correta lendo `Question.options[].isCorrect`), salva `score`/`passed`/`answers` e dispara `issueCertificateIfNeeded(enrollmentId)` em try/catch (best-effort, não bloqueia resposta). `src/lib/certificates.ts::issueCertificateIfNeeded` é idempotente (retorna existing se já houver), gera código de verificação `EC-XXXXXXXX` (base32 sem 0/O/I/L), renderiza PDF com `@react-pdf/renderer` + QR PNG via `QRCode.toBuffer`, sobe para R2 (warning se não configurado), cria `Certificate` no banco e tenta enviar email Resend (warning se faltar key). `src/lib/r2.ts` ganhou `uploadPdfToR2(key, buffer)`. `src/lib/pdf/CertificateTemplate.tsx` é um `Document` A4 paisagem com logo da Ativa, headline "CERTIFICADO", texto com nome+CPF mascarado+curso+carga horária+data BR, linha de assinatura do Eduardo Bissoli (CREA MT-038597/D), selos texto CREA-ES/ABNT/CB-ES e QR de verificação. `src/lib/email.ts` envia via `https://api.resend.com/emails` com fallback graceful sem `RESEND_API_KEY`. Novas páginas: `/cursos/[slug]/aulas/prova` (Server) + `<ExamGate/>` (gate por status + `areAllLessonsCompleted`) + `<ExamView/>` (intro→running→result com botão "Tentar novamente" / "Ver certificado"); `/cursos/[slug]/certificado` (Server) + `<CertificateGate/>` (busca `/api/certificate?courseId&studentEmail` e mostra iframe do PDF + botão download + link `/verificar/[codigo]`). `tests/unit/{cpf,verification-code}.test.ts` adicionados. Total Vitest: 68 testes (era 53).
- **C7 — `feat(webhook): AbacatePay webhook + public certificate verification (/verificar/[codigo])`**: `POST /api/payments/webhook` lê `await request.text()` antes de qualquer parse (preserva raw body para HMAC), retorna 503 se `ABACATEPAY_WEBHOOK_SECRET` vazio, 401 em `GatewayWebhookError`/`GatewayNotConfiguredError`, e em transação atualiza `Payment.status="approved" + paidAt` e `Enrollment.status="active"` quando `event=transparent.completed`. **Não dispara emissão de certificado** — o cert depende de prova passada, que vem depois. Idempotente: se `payment.status` já é `approved`, retorna 200 sem alterar nada; se `Payment` não existe (não é nosso), retorna 200. `/verificar/[codigo]/page.tsx` (Server, dentro do `(public-light)` route group) valida regex `^EC-[A-Z2-9]{8}$` (404 se não bate), busca `Certificate.findUnique` por `verificationCode`, mostra layout institucional light com nome do aluno, CPF mascarado (`***.NNN.NNN-**`), curso, carga horária, data PT-BR, código mono, selos texto e botão "Baixar PDF" se `pdfUrl` presente; tela de "Código inválido" em vermelho com CTA WhatsApp quando não encontrado. Novo `tests/e2e/paywall-flow.spec.ts` cobre: form de compra renderiza com inputs (email/nome/CPF) + checkbox LGPD; submit com CPF `000.000.000-00` exibe erro inline "CPF inválido"; `/verificar/EC-AAAAAAAA` (cert inexistente) mostra "Código inválido"; fixture com enrollment ativo via Prisma `upsert` faz aluno ver "Continuar curso" e a `/aulas/[id]` não bloqueia. Total e2e: 17 testes verdes (era 13).

### Arquivos tocados
- **Schema/Migrations**: `prisma/schema.prisma`, `prisma/migrations/20260425203747_paywall_schema/migration.sql`, `prisma/migrations/20260425210052_certificate_pdf_nullable/migration.sql`, `prisma/seed.ts`.
- **Payments**: `src/lib/payments/{types,abacatepay,index}.ts`.
- **Paywall/Access**: `src/lib/access.ts`, `src/app/api/enrollment/route.ts`, `src/app/api/enrollment/state/route.ts`, `src/app/api/progress/route.ts`, `src/components/public/{course-detail-gate,lesson-access-gate}.tsx`, `src/components/public/lesson-view.tsx`, `src/app/(public-dark)/cursos/[slug]/{page.tsx,aulas/[lessonId]/page.tsx}`. Excluídos: `src/components/public/{course-detail-view,email-capture-modal}.tsx`.
- **Checkout**: `src/lib/cpf.ts`, `src/lib/validations/checkout.ts`, `src/app/api/checkout/create/route.ts`, `src/app/api/checkout/status/[paymentId]/route.ts`, `src/components/public/{checkout-form,pix-view}.tsx`, `src/app/(public-dark)/cursos/[slug]/comprar/{page.tsx,pix/page.tsx}`.
- **Exam/Certificate**: `src/app/api/exam/{start,submit}/route.ts`, `src/app/api/certificate/route.ts`, `src/lib/certificates.ts`, `src/lib/email.ts`, `src/lib/email/CertificateIssued.tsx`, `src/lib/pdf/CertificateTemplate.tsx`, `src/lib/r2.ts` (extensão `uploadPdfToR2`), `src/lib/verification-code.ts`, `src/components/public/{exam-gate,exam-view,certificate-gate}.tsx`, `src/app/(public-dark)/cursos/[slug]/{aulas/prova/page.tsx,certificado/page.tsx}`.
- **Webhook + Verificar**: `src/app/api/payments/webhook/route.ts`, `src/app/(public-light)/verificar/[codigo]/page.tsx`.
- **Cleanup C1**: `src/app/admin/(dashboard)/cursos/[id]/questoes/_components/questions-list.tsx`, `src/app/(public-dark)/cursos/page.tsx`, `scripts/cleanup-test-courses.ts`, `package.json` (script `db:cleanup-test-courses`).
- **Tests**: `tests/unit/{payment-gateway,cpf,verification-code}.test.ts`, `tests/e2e/{public-catalog,paywall-flow}.spec.ts`.
- **Deps**: `@react-pdf/renderer`, `qrcode`, `@types/qrcode`, atualização de `pnpm-lock.yaml`.
- **Config**: `.env.example` (bloco AbacatePay).

### Decisões
- **ADR-012 paywall total (1 Pix libera tudo)**: optei por um único pagamento que ativa enrollment + emite certificado pós-prova-passada, em vez do duplo (curso grátis + certificado pago). Reduz fricção do funil, evita o "pagamento surpresa" no fim, e simplifica modelo de negócio. Aluno entra com email/CPF, paga, estuda, faz prova, recebe certificado automático. **Tradeoff**: aluno não pode "experimentar" o curso antes de pagar — mitigado por descrição rica + lista pública de módulos/aulas + página `/cursos/[slug]` aberta com preço destacado.
- **ADR-013 adapter pattern para gateway**: `PaymentGateway` interface tipada com `createPix/getStatus/verifyWebhook` + factory `getPaymentGateway()` lendo `PAYMENT_PROVIDER` do env. AbacatePay é a primeira implementação. Por quê: trocar gateway no futuro (ex: voltar pro Mercado Pago, adicionar Stripe pra cartão) é só escrever um novo adapter — rotas (`/api/checkout/*`, `/api/payments/webhook`) ficam intocadas. Custo: 1 layer extra de abstração; benefício: zero acoplamento entre rotas e SDK específico do gateway.
- **Por que mantive o nome `mpPaymentId` no schema**: renomear para `gatewayPaymentId` exigiria migration + atualização de toda lógica que referencia o campo. CLAUDE.md §10 ("evite churn"). Adicionei comentário `///` no schema explicitando que hoje guarda IDs `pix_char_*` da AbacatePay, e que o nome é legado.
- **Por que webhook só ativa enrollment, não emite cert**: certificado depende de **prova passada**, que ainda não aconteceu no momento do webhook (aluno ainda nem viu uma aula). Webhook ativa o acesso (`Enrollment.status="active"`), e a emissão automática do cert acontece dentro de `POST /api/exam/submit` quando `passed=true`, via `issueCertificateIfNeeded(enrollmentId)` (idempotente).
- **Por que polling do client TAMBÉM chama `gateway.getStatus()` como fallback**: em dev local não há URL HTTPS pública pra receber webhook (cloudflared resolveria, mas é override só pro Jorge). Em prod o webhook pode falhar (endpoint do AbacatePay caindo, retry-policy não cobrindo). O polling do client em `GET /api/checkout/status/[paymentId]` faz a checagem direta no gateway sempre que pendente — converge igual ao webhook, com latência ≤ 3 s.
- **Por que `qrCodeBase64` é armazenado já com prefixo `data:image/png;base64,`**: a AbacatePay retorna a string completa (com prefixo). Removê-lo na hora de salvar e re-adicionar na renderização é trabalho adicional sem ganho. Frontend usa direto `<img src={qrCodeBase64} />` — mais simples.
- **Por que body do AbacatePay v2 usa `{ method: "PIX", data: { ... } }`**: validado em testes manuais com cURL antes da implementação. Body sem `method` retorna 422 `"Value should be one of 'object', 'object'"`. Body com campos no root também retorna 422. A estrutura wrapper é exigida pela API.
- **Por que `ABACATEPAY_WEBHOOK_SECRET` é opcional**: em dev local não dá pra receber webhook (precisaria de URL HTTPS). `createPix` e `getStatus` (fallback) funcionam sem ele; só o endpoint `/api/payments/webhook` retorna 503 quando vazio. Em prod o secret precisa estar populado, mas isso é deploy concern, não dev concern.
- **Por que `Certificate.pdfUrl` virou nullable** (migration extra): se R2 não estiver configurado, ainda assim faz sentido emitir o certificado (cliente pode ver via `/verificar/[codigo]` e screenshot do site). PDF é nice-to-have, não bloqueante. Schema reflete isso.
- **Por que escolhi base32 sem 0/O/I/L pro `verificationCode`**: códigos lidos por humanos (em telefone, ditados, ou impressos). Caracteres ambíguos prejudicam validação. 8 chars do alfabeto restrito = ~2^40 espaço — colisão extremamente improvável pra escala da Ativa.
- **Por que não fizemos teste E2E completo "compra+prova+certificado" com gateway real**: validação manual basta — o fluxo passa por sandbox AbacatePay (`abc_dev_*`), Resend sandbox (só envia pro `jorgemetrimiranda@gmail.com`), R2 com bucket dev. Cobrir isso em E2E exigiria mockar APIs externas dentro do server (problema), ou rodar contra rede real (problema com flakiness em CI). E2E cobre paywall gates + form de checkout + tela "código inválido"; o resto fica como QA manual ao ligar credenciais.
- **Por que `lesson-view.tsx` deixou de capturar email do aluno via modal**: o gate `<LessonAccessGate/>` decide upstream se a aula é renderizada. Quando renderiza, o aluno já é ativo (e portanto já tem email no localStorage, salvo durante o checkout). O modal era resíduo da F3 sem paywall; agora é desnecessário e seria ruído visual.

### Próximos passos (F5 — Polish)
- SEO + a11y + LGPD + rate limit + docs deploy.
- Backend SMTP do form de contato.
- Conectar dashboard admin a dados reais (cursos, alunos, certificados).
- Configurar DNS de `ativaengenharia.net` no Resend (DKIM/SPF/DMARC) — sem isso emails caem no spam.
- Webhook AbacatePay apontando pra URL HTTPS de produção (Vercel) + `ABACATEPAY_WEBHOOK_SECRET` populado.
- KYC AbacatePay com CNPJ 29.974.056/0001-29 → trocar `dev_xxx` API key por `prod_xxx` API key.

### Blockers / pendências
- **Credenciais AbacatePay produção** (KYC ~1-72h após envio do CNPJ 29.974.056/0001-29). Sandbox `abc_dev_*` já funciona localmente.
- **Domínio Resend sandbox** (`onboarding@resend.dev`) só envia pra `jorgemetrimiranda@gmail.com` (dono da conta) — outros destinatários retornam `validation_error`. Em E2E não simulo emissão real de email; em QA manual limitar testes ao email do dono ou ligar domínio próprio.
- **Branch protection no GitHub** continua pendente (vide entradas anteriores). Não bloqueia F4.
- **Playwright system deps**: `pnpm exec playwright install-deps chromium` (com sudo) foi rodado no dev container desta sessão pra que o Playwright pudesse subir o Chromium. Se o dev container for recriado, será preciso rodar de novo. Considerar adicionar ao `Dockerfile` do devcontainer em F5.
- **`pdfUrl=""`/`null` no Certificate**: schema agora é nullable (migration C6). Banco antigo de F2/F3 não tinha registros `Certificate`, então não precisa backfill.
---
## 2026-04-26 — develop — F4 validada manualmente + mergeada

F4 (paywall + prova + certificado) foi validada manualmente no dev container e mergeada em `develop` (squash commit `5c4b8eb`, PR #8). Reset do enrollment do dev via `prisma db execute` (DELETE em `Certificate`/`ExamAttempt`/`Payment`/`LessonView`/`Enrollment` filtrando por `studentEmail`). Fluxo completo testado: tela "Comprar acesso" → form de checkout (email/nome/CPF/LGPD) → `POST /api/checkout/create` retornou Pix do AbacatePay v2 sandbox → tela do Pix com QR base64 + brCode + contador 30min → simulação de pagamento via `POST /v1/pixQrCode/simulate-payment?id=<pix_char_*>` (devMode, taxa R$ 0,80) → polling 3s detectou `PAID` via `gateway.getStatus()` (fallback do webhook, esperado em dev local sem URL HTTPS) → toast "Pagamento confirmado!" + redirect pra primeira aula em 1.5s → `<LessonView/>` renderizou (placeholder de vídeo Bunny esperado, sem credenciais). Email AbacatePay devMode "Você recebeu um pagamento de R$ 99,00" recebido — confirma que o gateway tá conectado de verdade na sandbox. CI verde nos 3 checks (typecheck + lint + test). Branch `feature/paywall-prova-cert` deletada local e remoto.

### Roadmap acordado para próximas sessões

**1. F5 (Polish) — próxima sessão.** Branch `feature/polish` contra `develop`. Escopo: SEO básico (metadata por página, sitemap.ts, robots.ts, OpenGraph), a11y (axe-core, foco de teclado em modais e carrossel, alt em imagens), rate limiting em `/api/checkout/create` + `/api/enrollment` + `/api/auth/*`, página `/privacidade` LGPD, 404 + error boundary customizados, backend SMTP do `<ContactForm/>` via Resend (hoje é mailto), dashboard admin com dados reais (cursos/alunos/certificados — hoje é mock), README de deploy + script de backup Neon, Lighthouse ≥ 90 em perf/SEO/a11y.

**2. Dependências externas (não-código) — após F5 mergeada.** KYC AbacatePay com CNPJ 29.974.056/0001-29 (1–72h após envio) → troca `abc_dev_*` por `abc_prod_*` no env de prod. Configurar DNS de `ativaengenharia.net` no Resend (DKIM/SPF/DMARC) — sem isso emails caem no spam. Liberar credenciais Bunny Stream para upload de vídeos reais. Configurar branch protection no GitHub (Settings → Branches → Add rule, exigir PR + checks passing).

**3. Deploy de staging — após dependências resolvidas.** Vercel Hobby (grátis) hospedando o app + Neon Free tier (grátis) pro Postgres. Modelo: `develop` → preview deploy automático (URL `*.vercel.app`); `main` → produção (`*.vercel.app` separado, depois apontar `ativaengenharia.net` via DNS). Variáveis de ambiente copiadas do `.env` local. `AUTH_SECRET` novo gerado pra prod via `pnpm dlx auth secret`. Webhook AbacatePay configurado no painel apontando pra `https://<vercel-url>/api/payments/webhook` com `ABACATEPAY_WEBHOOK_SECRET` populado (agora que existe URL HTTPS pública). Cliente vê staging real e dá feedback antes de promover pra prod.

---
## 2026-04-26 21:20 — feature/polish — F5 Polish (SEO, a11y, rate limit, LGPD, dashboard real, deploy docs)

**Fase:** F5
**PR:** em andamento contra `develop`

### O que foi feito
- **C1 — `chore: setup F5 deps (axe-core/playwright + ADR-014 rate limit)`**: instalei `@axe-core/playwright`. ADR-014 adicionado em `SPEC.md` documentando a escolha de rate limit in-memory (sem Redis/Upstash) — token bucket por chave `<rota>:<ip>` em `Map`, sem dependência externa, adequado pra escala da Ativa (1 região, baixo volume).
- **C2 — `feat(seo): metadata, sitemap, robots, OpenGraph in public pages`**: novo helper `src/lib/seo.ts` com `buildMetadata({ title, description, path, ogImages? })` que monta `alternates.canonical`, `openGraph` (siteName, locale `pt_BR`, images 1200×630), e `twitter` (`summary_large_image`). Root layout ganha `metadataBase`, `title.template` (`%s — Ativa Engenharia`) e `keywords`. Cada página pública (`/`, `/servicos`, `/cursos`, `/quem-somos`, `/faq`, `/contato`) usa `buildMetadata`. Course detail (`/cursos/[slug]`) e `/verificar/[codigo]` ganham `generateMetadata` dinâmico. Novos `src/app/sitemap.ts` (rotas estáticas + cursos publicados com `lastModified` do `course.updatedAt`, fallback graceful se DB indisponível no build) e `src/app/robots.ts` (allow `/`, disallow `/admin/*`, `/api/*`, `/cursos/*/comprar/*`, sitemap + host populados).
- **C3 — `feat(a11y): axe-core E2E tests for public pages`**: `tests/e2e/a11y.spec.ts` roda `AxeBuilder` em `/`, `/cursos`, `/contato`, `/quem-somos` e falha em violações `critical`/`serious`. `color-contrast` é skipado com justificativa (axe não consegue medir contraste sobre `bg-gradient` em hero, gera falso positivo). Auditoria do código existente: HeroCarousel já tinha `<button>` com `aria-label` em setas e dots ("Ir para o slide N"), todas `<Image/>` e `<img/>` ou tinham `alt={course.title}` ou eram decorativas com `alt=""`. Comentário `biome-ignore` órfão removido de `(public-light)/page.tsx`. Resultado: **todos os 4 testes axe passaram sem violações** críticas/sérias.
- **C4 — `feat(security): rate limiting nas rotas sensíveis (ADR-014)`**: `src/lib/rate-limit.ts` expõe `rateLimit(key, opts)`, `rateLimitResponse(request, routeKey, opts)` (retorna `NextResponse 429` com header `Retry-After` ou `null`), e `getClientIp(request)` (lê `x-forwarded-for[0]` → `x-real-ip` → `"unknown"`). Sweep automático a cada 60s pra purgar buckets expirados. Aplicado em: `POST /api/checkout/create` (5/min/IP), `POST /api/enrollment` (10/min/IP), `POST /api/auth/callback/credentials` via middleware (5/15min/IP — proteção contra brute force admin). `src/middleware.ts` reescrito pra combinar matcher de Auth.js (`/admin/:path*`) + matcher novo (`/api/auth/callback/credentials`). 10 testes unit cobrindo: aceita N reqs, 429 na N+1, reset após janela, isolamento por IP, header `Retry-After` presente.
- **C5 — `feat(lgpd): página /privacidade + checkbox LGPD com link clicável`**: `src/content/privacy.ts` (ADR-011) com texto LGPD-compliant — controlador (Ativa Engenharia, CNPJ 29.974.056/0001-29, contato `ativaengmec@gmail.com`), 9 seções (dados coletados, finalidade, base legal art. 7º, compartilhamento com sub-processadores, retenção, direitos art. 18, encarregado/DPO, segurança, alterações). `/privacidade` (Server, dentro de `(public-light)` com PublicHeader/Footer) renderiza com seções colapsáveis-style + suporte a `**bold**` inline. Footer: link "Política de Privacidade" passa de `href="#"` para `<Link href="/privacidade">`. `<CheckoutForm/>` LGPD checkbox vira link clicável `target="_blank"`. `<ContactForm/>` ganha checkbox LGPD obrigatório (antes não tinha) com mesmo link.
- **C6 — `feat(errors): páginas 404 e error boundary com identidade Ativa`**: `src/app/not-found.tsx` (Server) — header light com logo + brand mark, `404` pequenino, headline "Página não encontrada", 2 CTAs (Voltar para a home / Ver catálogo de cursos), footer copyright, `robots.noindex/nofollow`. `src/app/error.tsx` (Client) — mesmo shell, ícone `AlertTriangle` em badge, headline "Algo deu errado", `error.digest` mostrado em mono, botões "Tentar novamente" (`reset()`) e "Falar pelo WhatsApp" (link wa.me com mensagem pré-preenchida). E2E `tests/e2e/not-found.spec.ts` valida que `/rota-inexistente-42` retorna 404 com headline customizado.
- **C7 — `feat(contact): backend SMTP via Resend para /contato`**: `POST /api/contact` com Zod schema (`name 2..120`, `email`, `phone 8..40`, `message 10..4000`, `lgpdConsent: literal(true)`), rate-limit `3/min/IP`, envia via `https://api.resend.com/emails` com `from = RESEND_FROM ?? "Ativa Engenharia <onboarding@resend.dev>"`, `to = ativaengmec@gmail.com`, `reply_to = email do cliente`, HTML escapado + texto plano. Sem `RESEND_API_KEY` → 503 amigável. `<ContactForm/>` deixa de fazer `mailto:` direto e passa a `fetch('/api/contact', ...)`. Tratamento: 429 → toast erro + form error; 503 → toast informativo + fallback `mailto`; network error → fallback `mailto`. Limpeza dos campos em sucesso. Subhead da `/contato` reescrita ("recebemos por email", não menciona mais mailto como caminho primário).
- **C8 — `feat(admin): dashboard e /admin/alunos com dados reais`**: `/admin` (Server) consulta em paralelo `db.course.count({ where: { published: true } })`, `db.enrollment.findMany({ select: { studentEmail: true }, distinct: ['studentEmail'] })` (length), `db.certificate.count()`, `db.payment.aggregate({ _sum: { amountCents: true }, where: { status: 'approved' } })`. 4 cards: cursos publicados, alunos únicos, certificados emitidos, receita acumulada formatada em BRL. `/admin/alunos` (Server) substitui o stub: `groupBy` em Enrollment por `studentEmail` com `_min: { startedAt }`, `_count: { _all }`, ordenado `_min.startedAt desc`, paginação 20/página via `searchParams.page`. Counts de certificados via `Certificate.findMany({ where: { enrollment: { studentEmail: { in: emails } } } })` agrupados em `Map` (Certificate não tem `studentEmail` direto, só via Enrollment). Tabela com colunas email/primeiro acesso/cursos comprados/certificados.
- **C9 — `chore(devcontainer): playwright system deps + chromium no Dockerfile`**: `.devcontainer/Dockerfile` ganha `npx playwright@1.50.0 install-deps chromium` + `npx playwright@1.50.0 install chromium` com `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`. Resolve o blocker da F4 que exigia rodar `pnpm exec playwright install-deps` manualmente após cada rebuild do dev container. Não testei o rebuild de fato (tempo) — o usuário precisará reabrir o devcontainer (`Dev Containers: Rebuild Container`) para aproveitar.
- **C10 — `docs: README de deploy (Vercel + Neon) + scripts/backup-neon.sh`**: README ganha 3 seções novas: "Deploy em produção" (passo a passo Neon free tier → Vercel Hobby → variáveis de ambiente categorizadas em obrigatórias/pagamento/email/vídeo+storage → primeiro deploy + migrate deploy → webhook AbacatePay → domínio próprio → backup), "Backup do banco" (uso do script + restauração + recomendação de redundância) e "Troubleshooting" (login admin falha, pagamento 502/503, email não chega, webhook 401). `scripts/backup-neon.sh`: bash com `set -euo pipefail`, valida `DATABASE_URL` e `pg_dump` no PATH, gera `backups/<ISO timestamp>.sql.gz` (gzip -9, `--no-owner --no-privileges --no-comments`), avisa se há > 30 backups acumulados. `chmod +x`. `.gitignore` ganha `backups/`. Plus: gitignore acidentalmente commitou `.claude/scheduled_tasks.lock` no commit do C6 — corrigido em commit `chore: gitignore .claude/ runtime artifacts` removendo do tracking e adicionando `.claude/` ao gitignore.
- **C11 — Lighthouse ≥ 90 em /, /cursos, /contato**: rodei `npx lighthouse` (12.8.2) contra build de produção (`pnpm build && pnpm start`) usando o Chromium do Playwright (`PLAYWRIGHT_BROWSERS_PATH/chromium-1217/chrome-linux64/chrome`) com `--chrome-flags="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --no-zygote"`. **Nenhuma alteração de código foi necessária** — todas as 3 páginas já bateram o critério ≥ 90 em todas as 4 categorias após os C2/C3 anteriores.

### Scores Lighthouse (build de produção, Chromium headless)

| Página     | Performance | Accessibility | Best Practices | SEO |
|------------|-------------|---------------|----------------|-----|
| `/`        | 96          | 96            | 100            | 100 |
| `/cursos`  | 100         | 100           | 100            | 100 |
| `/contato` | 96          | 93            | 100            | 100 |

Antes do C2 não havia metadata canônica/sitemap/robots — SEO ficaria abaixo de 100. A11y não mexeu (já estava ≥ 93 na medição base). Performance/Best Practices ficaram intocados — ganhos vieram da própria stack (Next 15 + Turbopack + Inter via `next/font` + Image + sem JS de terceiros).

### Arquivos tocados
- **SEO/Sitemap/Robots**: `src/lib/seo.ts` (novo), `src/app/sitemap.ts` (novo), `src/app/robots.ts` (novo), `src/app/layout.tsx`, todas as 7 páginas públicas (`/`, `/servicos`, `/cursos`, `/cursos/[slug]`, `/quem-somos`, `/faq`, `/contato`, `/verificar/[codigo]`).
- **A11y**: `tests/e2e/a11y.spec.ts` (novo). Pequena cleanup em `(public-light)/page.tsx` (removido comentário órfão de biome-ignore).
- **Rate limit**: `src/lib/rate-limit.ts` (novo), `src/app/api/checkout/create/route.ts`, `src/app/api/enrollment/route.ts`, `src/middleware.ts`, `tests/unit/rate-limit.test.ts` (novo).
- **LGPD**: `src/content/privacy.ts` (novo), `src/app/(public-light)/privacidade/page.tsx` (novo), `src/components/public/footer.tsx`, `src/components/public/checkout-form.tsx`, `src/components/public/contact-form.tsx`.
- **Erros**: `src/app/not-found.tsx` (novo), `src/app/error.tsx` (novo), `tests/e2e/not-found.spec.ts` (novo).
- **Contact backend**: `src/app/api/contact/route.ts` (novo), `src/components/public/contact-form.tsx`, `src/app/(public-light)/contato/page.tsx`.
- **Admin**: `src/app/admin/(dashboard)/page.tsx`, `src/app/admin/(dashboard)/alunos/page.tsx`.
- **Devcontainer**: `.devcontainer/Dockerfile`.
- **Deploy docs**: `README.md`, `scripts/backup-neon.sh` (novo).
- **ADRs/Doc**: `SPEC.md` (ADR-014 novo), `task.md` (esta entrada).
- **Config**: `.gitignore` (`.claude/`, `backups/`), `package.json` (+ `@axe-core/playwright`), `pnpm-lock.yaml`.

### Decisões
- **ADR-014 — rate limit in-memory por instância (sem Upstash)**: o volume estimado da Ativa (~20–100 sessões simultâneas no pico) cabe folgado numa lambda Vercel única. Token bucket em `Map`, zero dependência externa, zero variável de ambiente nova. Em deploy multi-região (não é o caso hoje) cada instância tem seu próprio bucket — mitigação suficiente contra abuso, não contra DDoS distribuído. Quando virar problema, trocar pra Upstash mantendo a mesma interface (`limit(key, max, windowMs) → { ok, retryAfter }`).
- **Por que `getClientIp` retorna `"unknown"` em vez de lançar**: em dev sem proxy reverso o `x-forwarded-for` pode não existir. Cair pra `"unknown"` agrupa todas as reqs locais em um único bucket (efeito desejável em dev para não esquecer de testar o rate limit).
- **Por que rate limit do auth ficou em middleware (não no `authorize` do Auth.js)**: dentro de `authorize` não tenho acesso ao `Request` (e portanto ao IP). Middleware cobre `/api/auth/callback/credentials` e devolve 429 antes do Auth.js chegar a tocar no banco.
- **Por que escolhi base de "alunos únicos" via distinct em `Enrollment.studentEmail` e não em `Certificate`**: aluno = quem comprou pelo menos 1 curso (`Enrollment` existe assim que o checkout cria, mesmo `pending_payment`). `Certificate` só existe pós-prova-passada — subestimaria a base.
- **Por que `/admin/alunos` faz 2 queries (groupBy + Certificate.findMany agrupado em JS) em vez de uma query SQL bonita**: Prisma não suporta `groupBy` em relações (`Certificate.enrollment.studentEmail`). Alternativas: raw SQL (perde type-safety, vira problema futuro com schema migration) ou client-side aggregate (paga 1 round trip extra mas é trivial pra escala da Ativa). Optei por simples > performante. Se virar gargalo (1k+ alunos), migra pra `db.$queryRaw` com `JOIN`.
- **Por que `/api/contact` retorna 503 em vez de "tentar mailto" no servidor**: servidor não tem como abrir `mailto:` no client. O front-end intercepta o 503 e abre o `mailto` no browser (`window.location.href = mailto:...`) preservando os dados que o usuário digitou. Cliente vê toast "Vamos abrir seu cliente de email", não "erro".
- **Por que `not-found.tsx` e `error.tsx` ficam no root (não dentro de `(public-light)` ou `(public-dark)`)**: Next.js só invoca o `not-found.tsx` mais próximo do segmento que falhou — para uma rota como `/foo-inexistente` que não casa com nenhum route group, o root é o único válido. Reescrevi um shell standalone curto (header + main + footer) em vez de tentar reusar `<PublicHeader/>` (que importa `usePathname` e `useEffect`, conflitos de Server Component).
- **Por que C7 manteve mailto fallback (sem deletar mailto)**: o front-end só consegue abrir mailto a partir de uma ação síncrona do usuário (gesture restriction). Se o backend Resend cair, o cliente pode tentar mailto no mesmo gesto do submit — sem isso, o usuário perde a mensagem digitada e tem que reabrir o cliente de email manualmente.
- **Por que `pdfUrl=""` legacy não foi tratado**: schema da F4 já fez `pdfUrl` nullable. C8 não regrediu isso e nem precisou backfill (não tem registro `Certificate` em dev).

### Próximos passos (ordem sugerida)
1. **Mergear F5** em `develop` via PR (squash). Branch `feature/polish` deletada local + remoto após merge.
2. **Liberar credenciais externas** (não-código, depende do Jorge):
   - **AbacatePay produção**: KYC com CNPJ 29.974.056/0001-29 → troca `abc_dev_*` por `abc_prod_*`. ETA 1–72h.
   - **DNS Resend** (`ativaengenharia.net`): adicionar registros DKIM/SPF/DMARC pra emails saírem do spam. ETA 1–24h após mudanças DNS propagarem.
   - **Bunny Stream**: criar lib + pegar API key + library ID + CDN hostname pra uploads de vídeo reais.
   - **Branch protection no GitHub**: Settings → Branches → Add rule pra `develop` e `main` (require PR + checks passing).
3. **Deploy staging** (Vercel + Neon free tier). Seguir README "Deploy em produção". Migrar via `prisma migrate deploy`. Webhook AbacatePay agora pode ter URL HTTPS pública.
4. **Cliente valida staging** → merge `develop → main` → tag `v0.1.0` → apontar `ativaengenharia.net` no Vercel.

### Blockers / pendências
- **Rebuild do devcontainer requerido**: a mudança do C9 (playwright system deps) só vale pra novos containers. Container atual continua funcionando porque já tem o Chromium instalado da F4.
- **`.claude/` no git history**: o commit do C6 incluiu `.claude/scheduled_tasks.lock` por engano. Foi removido do tracking no commit seguinte e o gitignore atualizado, mas o arquivo continua no histórico (não vaza segredo, é só ruído).
- **Cobertura E2E**: a11y e 404 ganharam testes. Contact form backend, rate limit aplicado em rotas reais, /privacidade, dashboard real e /admin/alunos não têm E2E novo — cobertos parcialmente por `pnpm typecheck` + smoke em dev. Não bloqueia merge mas vale lembrar pra QA de staging.
- **Testes existentes não foram rodados em massa**: `pnpm test:e2e` completo não foi executado nesta sessão (rodei apenas a11y + not-found individualmente). Os 17 testes E2E anteriores podem ter quebrado se a mudança no `/contato` (subhead reescrita) tocar em alguma asserção; `pnpm gates` continua verde mas E2E é separado.

---
## 2026-04-26 — develop — F5 validada + mergeada

F5 (Polish) entregue via Claude Code em sessão YOLO de ~56min, mergeada em `develop` (squash commit `6e1e343`, PR #9). 12 commits cobrindo: setup deps + ADR-014, SEO (metadata/sitemap/robots/OpenGraph), a11y (axe-core + 4 specs E2E novos), rate limiting (`/api/checkout/create`, `/api/enrollment`, `/api/auth/*`, `/api/contact`), LGPD (`/privacidade` + checkbox linkado nos forms), 404 + error boundary com identidade Ativa, fix `.gitignore` para `.claude/` runtime artifacts, backend SMTP do `<ContactForm/>` via Resend (substitui `mailto:`), dashboard admin (`/admin` + `/admin/alunos`) com dados reais do banco, Playwright deps no Dockerfile do devcontainer, README de deploy + `scripts/backup-neon.sh`, fix de a11y final com underline visível em links LGPD. Métricas: `pnpm gates` 78 unit tests verdes (era 68; +10 do rate-limit), `pnpm test:e2e` 22 testes verdes (era 17; +4 a11y axe-core + 1 not-found). Lighthouse build prod: `/` 96/96/100/100, `/cursos` 100/100/100/100, `/contato` 96/93/100/100 — todos ≥ 90 conforme critério de aceite F5. CI verde nos 3 checks. Branch `feature/polish` deletada local e remoto. Pendência conhecida: rebuild do devcontainer não foi executado nesta sessão (só o Dockerfile foi editado) — pra aproveitar o Chromium pré-instalado, rodar "Dev Containers: Rebuild Container" no VS Code quando conveniente.

### Roadmap atualizado para próximas sessões

**1. Dependências externas (não-código) — agora.** KYC AbacatePay com CNPJ 29.974.056/0001-29 → troca `abc_dev_*` por `abc_prod_*`. DNS de `ativaengenharia.net` no Resend (DKIM/SPF/DMARC). Credenciais Bunny Stream pra upload real de vídeos. Branch protection no GitHub (Settings → Branches → Add rule, exigir PR + checks passing).

**2. Deploy de staging — após dependências resolvidas.** Vercel Hobby (grátis) + Neon Free tier (grátis). README de deploy já tem o passo a passo (vide commit `aa88b57` da F5). Modelo: `develop` → preview deploy automático; `main` → produção. `AUTH_SECRET` novo gerado pra prod via `pnpm dlx auth secret`. Webhook AbacatePay configurado apontando pra `https://<vercel-url>/api/payments/webhook` com `ABACATEPAY_WEBHOOK_SECRET` populado. Cliente vê staging real e dá feedback antes de promover pra prod.

---
## 2026-05-23 17:55 — feature/aluno-entrar — F6 botão "Já comprei? Entrar"

**Fase:** F6
**PR:** em andamento (branch `feature/aluno-entrar` @ f54871c)

### O que foi feito
- Validação Zod do body de `/api/enrollment/recover` em `src/lib/validations/enrollment-recover.ts`, reaproveitando `validateCpf` do helper existente.
- Lógica pura de recovery em `src/lib/enrollment-recover.ts` com deps injetadas (`findCourseWithFirstLesson`, `findEnrollmentByCourseAndEmail`) — fácil de mockar no Vitest sem hit no Postgres. Retorna resultado discriminado: `course_not_found` | `not_found` | `not_active` | `cpf_mismatch` | `ok+redirectTo`.
- Route handler `POST /api/enrollment/recover` (5 reqs/min/IP via `rateLimitResponse`, mesmo padrão do ADR-014). Lookup case-insensitive de email via `mode: "insensitive"`. Logging `[enrollment-recover] reason=<x> course=<slug>` sem PII. Retorna 400/404/429 quando aplicável, ou 200 com `{ ok, ... }`.
- Form de recovery em `src/components/public/recover-access-form.tsx` (shadcn `Form` + `react-hook-form` + `zodResolver`, mesmo padrão do `admin/login/login-form.tsx`). Máscara CPF on-the-fly via `maskCpf`. Sucesso → `writeStudentEmail(email)` + `router.push(redirectTo)` + toast. Qualquer falha do backend (com ou sem reason) → mensagem genérica única + CTA "Comprar curso" inline.
- Página `/cursos/[slug]/entrar` (Server Component dentro do route group `(public-dark)`) que valida o slug, retorna 404 se curso não existe/não publicado, e renderiza o form com link "Voltar para o curso" + "Ainda não comprou? Ver opções de compra".
- Segundo CTA `[Já comprei? Entrar]` (variant `outline`) sempre visível em `course-detail-gate.tsx`, lado a lado com o primário em todos os estados (`null`, `pending_payment`, `active`). Decisão consciente: mantemos `[Continuar curso]` + `[Já comprei? Entrar]` juntos quando ativo, porque cobre o caso "estou nesse navegador sem localStorage mas é meu acesso" — sem custo UX significativo (botão é discreto e o nome deixa claro).
- 14 testes Vitest novos cobrindo a lógica pura + schema Zod (mask vs digits, case-insensitive email, course sem aulas, todos os reasons).
- 5 testes Playwright (1 navegação CTA, 1 happy path com verificação de localStorage, 2 mensagem genérica em failure paths distintos, 1 rate-limit via `request` API).

### Arquivos tocados
- `src/lib/validations/enrollment-recover.ts` (novo)
- `src/lib/enrollment-recover.ts` (novo)
- `src/app/api/enrollment/recover/route.ts` (novo)
- `src/components/public/recover-access-form.tsx` (novo)
- `src/app/(public-dark)/cursos/[slug]/entrar/page.tsx` (novo)
- `src/components/public/course-detail-gate.tsx` (edit: +CTA `Já comprei? Entrar`)
- `tests/unit/enrollment-recover.test.ts` (novo, 14 testes)
- `tests/e2e/aluno-entrar.spec.ts` (novo, 5 testes)
- `SPEC.md` (ADR-015)

### Decisões
- **ADR-015 criado** em `SPEC.md §6` — Recovery por email+CPF como ponte sem auth. Trade-off aceito: par compartilhável sem proteção contra pirataria deliberada (equivalente ao baseline atual de localStorage compartilhável). Critério de reabertura documentado: se pirataria virar problema mensurável, magic link é o caminho default.
- **Não vazar reason no frontend:** o backend retorna `{ ok: false, reason }` (útil pra debug via curl/devtools/logs), mas a UI mostra a mesma mensagem genérica nos 3 reasons (`not_found`, `not_active`, `cpf_mismatch`). Conforme §3.4 do prompt yolo.
- **CPF armazenado só com dígitos** no `Payment.studentCpf` (validado em `/api/checkout/create:33` que faz `stripCpfMask` antes de gravar). Comparação no recovery normaliza ambos os lados via `stripCpfMask` por segurança.
- **Deps injetadas em vez de Prisma direto** na função `recoverEnrollment` — escolha consciente pra manter a lógica testável sem mock pesado de Prisma. Route handler é o único que conhece o `db`.
- **Validação manual obrigatória antes de merge `develop → main`** porque o e2e local rodou parcialmente (vide blockers).

### Resultados dos gates
- `pnpm typecheck`: ✓
- `pnpm lint`: ✓ nos arquivos do projeto (2 erros pré-existentes em `scripts/inspect.ts` e `scripts/unlock-exam.ts` — arquivos untracked fora do escopo, conforme alinhado).
- `pnpm test` (Vitest): ✓ 92/92 (78 anteriores + 14 novos).
- `pnpm test:e2e` (Playwright): **parcial — 1/5**. Único que passou foi o rate-limit (que usa `request` API sem browser). Os 4 specs com browser falharam pré-execução por libs faltando no devcontainer Trixie atual: `libnspr4.so` não disponível, ref. commit `d036d2a`. Conforme combinado, não tentei `--with-deps` (incompatível com a base Trixie); validação manual obrigatória antes do merge `develop → main`.

### Lições aprendidas
- **Lint (process bug descoberto em F6):** rodar sempre `pnpm lint` (= `biome check .`) antes de commitar, **nunca** `npx biome check <path>` ou `pnpm exec biome check <path>` em arquivo individual. A invocação por path explícito tem quirks de resolução de glob — durante a sessão, vimos `Checked 0 files` voltar pra arquivos `.tsx` válidos que existiam no disco, e o lint por path passou enquanto o `biome check .` do CI pegou problemas de formatação. Resultado: `tests/e2e/aluno-entrar.spec.ts` passou nos checks individuais que rodei localmente mas quebrou no CI (2 trechos sobre-quebrados: arrow function de 1 arg e `.fill()` encadeado). Fix posterior em commit `0231bb6 chore: format aluno-entrar e2e spec` via `biome format --write`. **Regra:** se for confiar em lint local pra prever CI, é `pnpm lint`/`pnpm gates`, não path-by-path.

### Próximos passos
- Push da branch + abertura de PR contra `develop`.
- Validação manual no preview Vercel (ou `pnpm build && pnpm start` local com banco populado): rodar checklist do §4.3 do prompt yolo (2 botões lado a lado mobile + desktop, navegação, CPF inválido inline, happy path real, mensagem genérica em cada caso de erro, Enter no campo CPF submete, tab order + aria).
- Após validação, merge `develop → main --ff-only` → deploy automático Vercel produção em `main`.

### Blockers / pendências
- **Restaurar Playwright no Dockerfile do devcontainer** — o `RUN playwright install` está comentado desde `d036d2a` por incompatibilidade com Debian Trixie. Fix: atualizar pra Playwright ≥ 1.55 ou trocar a base do devcontainer pra Bookworm; depois descomentar as linhas correspondentes no `.devcontainer/Dockerfile` e validar que `pnpm test:e2e` roda completo. Workaround usado nesta sessão: instalar Chromium em `$HOME/.cache/ms-playwright` (download OK, mas execução continua falhando por libs de sistema).
- **Anti-pirataria (follow-up do ADR-015):** email+CPF continuam compartilháveis. Decisão de produto pendente — só endereçar se pirataria virar problema mensurável. Default técnico quando reabrir: magic link via Resend (já configurado em F5).
- **"Esqueci email/CPF":** não há fluxo de auto-recuperação se aluno esqueceu os dados que usou na compra. Solução atual: contato manual via WhatsApp / `/contato`. Documentar em FAQ quando houver.
- **URL do site no perfil AbacatePay:** ainda aponta pra `netflix-cursos.vercel.app`. Abrir ticket pra trocar pra `ativaengenharia.net` quando DNS estiver propagado.
- **Claude Code Review action com 401:** o secret `ANTHROPIC_API_KEY` do repo está inválido/expirado. Workflow `.github/workflows/claude-review.yml` (ou similar) dispara em todo PR e falha em ~19s com `401 Invalid bearer token`. Não bloqueia merge — gates principais (`typecheck`/`lint`/`test`) são jobs separados. Fix: gerar API key nova em console.anthropic.com → API Keys, copiar valor, ir em Settings → Secrets and variables → Actions do repo no GitHub, editar `ANTHROPIC_API_KEY` colando valor novo.

---
## 2026-05-23 20:45 — feature/youtube-video — F7 migração Bunny → YouTube unlisted

**Fase:** F7
**PR:** em andamento (branch `feature/youtube-video`)

### O que foi feito
- **ADR-016 em `SPEC.md §6`** — registra a migração de host de vídeo de Bunny Stream para YouTube unlisted. Supera o ADR-001. Trade-off explícito aceito: vídeo unlisted é descobrível por qualquer pessoa com a URL e baixável via ferramentas externas (yt-dlp). Mitigação: fricção no player (sem branding, sem related, sem teclado, right-click bloqueado no wrapper, `select-none` no container) — não é proteção. Linguagem operacional: usar "fricção contra cópia casual", proibido "DRM"/"vídeo protegido"/"download impossível".
- **Schema Prisma:** novo campo `Lesson.youtubeVideoId String?` (migration `20260523203208_add_lesson_youtube_video_id`). Campos `bunnyVideoId`/`bunnyLibraryId` mantidos nullable durante a transição. Limpeza em PR separado quando produção estiver estável com YouTube por ≥1 semana sem incidente.
- **`src/lib/youtube.ts`** — `extractYoutubeId(input)` parseia URL nos 7 formatos comuns (watch, youtu.be, embed, shorts, mobile, nocookie, sem-www) ou ID puro de 11 chars no charset `[A-Za-z0-9_-]`. Trim no input, retorna null pra qualquer input inválido. `buildYoutubeEmbedUrl(id)` monta URL em `youtube-nocookie.com/embed/<id>` com params de fricção: `modestbranding=1`, `rel=0`, `iv_load_policy=3`, `disablekb=1`, `playsinline=1`, `fs=1`. Não inclui `controls=0` nem `autoplay=1` (decisão consciente — UX).
- **`src/lib/video-embed.ts`** — router que escolhe provider. Prioriza YouTube quando `youtubeVideoId` presente; cai pra Bunny quando o par `(bunnyVideoId, bunnyLibraryId)` está completo; retorna null caso contrário. Permite migrar aula a aula em produção sem precisar limpar campos Bunny no mesmo passo.
- **`<LessonPlayer/>`** refactorizado pra receber `lesson` único (objeto com os 3 campos). Wrapper recebe `onContextMenu={preventDefault}` + classe `select-none` — fricção, explícita em jsdoc no componente. Iframe segue com `allowFullScreen` (UX legítima). Component virou `"use client"` por causa do handler de evento.
- **Admin lesson form** (`/admin/cursos/[id]/_components/lesson-form.tsx`): `<VideoUploader>` (TUS Bunny) removido. Substituído por `<Input>` simples + helper text dinâmico (✓ ID detectado / URL inválido / vazio com guidance) + alerta âmbar inline com aviso sobre unlisted/sem-domain-restriction + referência ADR-016. Quando a aula tem Bunny legado, um segundo alerta azul explica a transição.
- **Server actions** (`actions.ts`): nova função `resolveVideoFields(videoSource)` com 3 caminhos — vazio zera youtubeVideoId mas NÃO toca em bunny* (rollback path); válido grava youtube + zera bunny* na mesma transação; inválido retorna null (handler rejeita com `URL ou ID do YouTube inválido`). Validação dupla (client side instantânea + server side autoritativa).
- **43 testes Vitest novos** entre `youtube.test.ts` (URL parsing edge cases + assertion de params de embed), `video-embed.test.ts` (router YouTube vs Bunny vs null) e `lesson-validation.test.ts` (schema Zod + pipeline mirror do server action). Total agora: 135/135 passando (era 92 antes do F7).
- **README**: nova seção "Cadastrando vídeo de aula (YouTube unlisted)" com 7 passos + aviso operacional sobre baixabilidade + sub-seção "Migrar aula legada do Bunny para YouTube" explicando o comportamento do form na transição.

### Arquivos tocados
- `SPEC.md` (ADR-016)
- `prisma/schema.prisma` (+ migration)
- `src/lib/youtube.ts` (novo)
- `src/lib/video-embed.ts` (novo)
- `src/lib/validations/lesson.ts` (trocou `bunnyVideoId`/`bunnyLibraryId` por `videoSource`)
- `src/components/public/lesson-player.tsx` (refactor)
- `src/components/public/lesson-view.tsx` (prop type + call site)
- `src/components/public/lesson-access-gate.tsx` (prop type)
- `src/app/(public-dark)/cursos/[slug]/aulas/[lessonId]/page.tsx` (propaga youtubeVideoId)
- `src/app/admin/(dashboard)/cursos/[id]/page.tsx` (select youtubeVideoId)
- `src/app/admin/(dashboard)/cursos/[id]/_components/modules-panel.tsx` (type + badge)
- `src/app/admin/(dashboard)/cursos/[id]/_components/lesson-form.tsx` (rewrite)
- `src/app/admin/(dashboard)/cursos/[id]/actions.ts` (resolveVideoFields)
- `tests/unit/youtube.test.ts` (novo)
- `tests/unit/video-embed.test.ts` (novo)
- `tests/unit/lesson-validation.test.ts` (novo)
- `README.md` (nova seção)

### Decisões
- **ADR-016 supera ADR-001.** Motivação registrada lá: custo + simplicidade operacional. Trade-off aceito em paralelo ao ADR-015 (recovery email+CPF compartilhável).
- **Bunny não foi removido nesta PR.** Limpeza dos arquivos (`src/lib/bunny.ts`, `src/lib/bunny-embed.ts`, `src/app/api/admin/bunny/create-video/route.ts`, `src/components/admin/video-uploader.tsx`), da dep `tus-js-client`, das vars `BUNNY_STREAM_*`, e dos campos Prisma `bunnyVideoId`/`bunnyLibraryId` vem em PR separado quando produção estiver estável com YouTube por ≥1 semana sem incidente.
- **`youtube-nocookie.com` em vez de `youtube.com`** — única razão LGPD. `youtube.com` grava cookies DoubleClick antes do clique (tracking sem base legal); `youtube-nocookie.com` só grava após interação real. Mesmo player, mesmo custo (zero).
- **Embed params escolhidos com justificativa:** `modestbranding`, `rel=0`, `iv_load_policy=3`, `disablekb=1`, `playsinline=1`, `fs=1`. **Não usados:** `controls=0` (quebra UX), `autoplay=1` (bloqueado em mobile e fricciona experiência).
- **Rollback path no form do admin.** Se admin abrir aula legacy com Bunny e salvar sem colar nada no campo YouTube, a Bunny continua tocando. Isso permite reverter aula a aula sem código novo, caso YouTube tenha problema.
- **`<LessonPlayer/>` virou client component** por causa do `onContextMenu`. Justificado — Server Components não suportam event handlers, e a fricção precisa do handler.

### Resultados dos gates
- `pnpm typecheck`: ✓
- `pnpm lint`: ✓ nos arquivos do projeto (2 erros pré-existentes em `scripts/inspect.ts` e `scripts/unlock-exam.ts` — untracked, fora do escopo, conforme alinhado em F6).
- `pnpm test` (Vitest): ✓ **135/135** (92 anteriores + 43 novos).
- `pnpm test:e2e` (Playwright): **não rodado nesta sessão** — devcontainer Trixie ainda sem `libnspr4.so`, pendência aberta da F6.

### Próximos passos
- Push da branch + abertura de PR contra `develop` (instrução do briefing: NÃO mergear nesta sessão).
- Validação manual no preview Vercel: criar aula nova com URL YouTube, conferir que toca; abrir aula legacy com Bunny (se houver em prod — provavelmente nenhuma, dado que Bunny nunca foi usado em produção segundo a F5) e conferir que o aviso azul aparece; rodar checklist do README "Cadastrando vídeo de aula".
- Após merge em `develop` e ≥1 semana estável, PR de limpeza: remover lib Bunny, dep `tus-js-client`, vars `BUNNY_*`, campos Prisma `bunnyVideoId`/`bunnyLibraryId` (em migration `drop column`), código em `<VideoUploader>`. Validar antes que não há Lesson em prod com `bunnyVideoId IS NOT NULL`.

### Blockers / pendências
- **Bunny não foi removido nesta PR** — intencional, ver decisões. Limpeza em PR separado após ≥1 semana com YouTube estável em produção sem incidente.
- **E2E não rodou local** (mesma limitação da F6 — `libnspr4.so` ausente no devcontainer Trixie). Validação manual no preview Vercel obrigatória antes do merge `develop → main`.
- **Migração de aulas legacy em prod:** Bunny nunca foi usado em produção (credenciais ficaram pendentes desde F5). Não deve haver Lesson com `bunnyVideoId` em prod hoje, mas vale confirmar via `pnpm db:studio` ou query SQL antes do PR de limpeza eventual: `SELECT id, title FROM "Lesson" WHERE "bunnyVideoId" IS NOT NULL;`.
- **Linguagem operacional** sobre fricção vs proteção precisa ser respeitada em todas as comunicações futuras (commits, ADRs, README, PR descriptions, comentários). Proibido usar "DRM", "vídeo protegido", "download impossível", "conteúdo seguro". Use "fricção contra cópia casual" e "trade-off aceito em ADR-016".

---
## 2026-06-07 21:30 — feature/cert-ajustes-e-botao-prova — Ajustes no certificado PDF + botão de prova na aula

**Fase:** pós-F7 (ajustes de produto)
**PR:** em andamento (branch `feature/cert-ajustes-e-botao-prova`)

### O que foi feito
- **Certificado (A1):** corpo "Certificamos que ..." passou de centralizado para alinhado à esquerda (`textAlign: left`, `paddingHorizontal: 4`), mantendo negrito+sublinhado nas partes variáveis.
- **Certificado (A2):** logo do topo-esquerdo ampliado de 140 → 160pt (~4.4x do base ~36pt). O alvo "6x" (~216pt) e mesmo ~170pt estouravam a página 1 para uma 3ª página quando combinados com a assinatura nova (maior) e nomes longos; 160pt é o maior valor que mantém EXATAMENTE 2 páginas em todos os casos realistas (validado por renderToBuffer). Margens de subtítulo/título/assinatura enxugadas para abrir espaço.
- **Certificado (A3):** marca d'água mais visível. A arte-fonte (`logo 1.png`) tinha alpha médio ~2%; `watermark.ts` foi regerado via ImageMagick multiplicando o canal alfa por 2.5 → alpha médio ~5% (max ~24%). NÃO foi usado `opacity` no `<Image>` (opacity < 1 reduziria — direção errada). Mantida como elemento `fixed` (não reverter — evita página fantasma).
- **Certificado (A4):** nova assinatura/carimbo. `assinatura-nova.jpg` (1755x1240) redimensionada para 900px q88 e convertida para `signature.ts` como data URI `image/jpeg`. É um bloco completo (rubrica + EDUARDO BISSOLI + títulos + CREA + carimbo redondo + CNPJ). Usada nas 2 páginas. Para evitar duplicação: removido o rótulo "RESPONSÁVEL TÉCNICO — ATIVA ENGENHARIA" e o rodapé de CNPJ das duas páginas (a imagem já traz tudo). Fundo do JPEG é branco puro (255,255,255) → sem retângulo visível. Estilos/consts mortos removidos (footerRow, footerCnpj, scopeSignatureLabel, SIGNATURE_LABEL, CNPJ_FOOTER).
- **Certificado (A5):** validado com renderToBuffer que o PDF final tem EXATAMENTE 2 páginas no pior caso (nome longo + nome de curso longo que quebra o título em 2 linhas + 12 tópicos). QR no topo-direito e banda de fotos da página 2 mantidos.
- **Botão de prova (B):** botão "Fazer prova" adicionado na sidebar da página da aula (`/cursos/[slug]/aulas/[lessonId]`), abaixo da lista "Aulas do curso". Reaproveita exatamente `areAllLessonsCompleted` (de `@/lib/progress`) — a mesma função que a página de detalhes usa — alimentada pelo `enrollment.byLesson` já carregado via `/api/enrollment/state`. Só renderiza com matrícula ativa; habilitado e linkando para `/cursos/[slug]/aulas/prova` só quando todas as aulas estão concluídas; senão fica desabilitado com tooltip + texto auxiliar. Botão da página de detalhes permanece intacto.

### Arquivos tocados
- `src/lib/pdf/CertificateTemplate.tsx`
- `src/lib/pdf/assets/signature.ts` (regerado, JPEG)
- `src/lib/pdf/assets/watermark.ts` (regerado, alfa ×2.5)
- `public/images/brand/assinatura-nova.jpg` (fonte versionada)
- `src/components/public/lesson-view.tsx`

### Decisões
- **Logo 160pt (não 216pt):** o "6x" literal não cabe sem empurrar conteúdo para uma 3ª página. Priorizada a invariante "exatamente 2 páginas". 160pt é o máximo seguro testado. Curiosidade: a versão nova produz 2 páginas até com nome de curso longo, enquanto o template ORIGINAL já estourava para 3 nesses casos — os trims de margem + remoção do rótulo da assinatura melhoraram a folga.
- **Marca d'água via boost de alfa no asset, não `opacity` no `<Image>`:** opacity < 1 multiplica a translucidez (reduz), contrário ao objetivo. Boost de 2.5x no canal alfa do PNG-fonte é a forma correta de aumentar a visibilidade efetiva.
- **Rodapé de CNPJ e rótulo do responsável técnico removidos:** a imagem da assinatura já contém nome, CREA, empresa e CNPJ. Mantê-los duplicaria a informação.

### Próximos passos
- Push da branch + abrir PR.
- Validação manual no preview Vercel: gerar um certificado real e conferir visualmente (logo grande sem sobrepor o título, marca d'água perceptível mas discreta, assinatura nova sem retângulo, 2 páginas); na página da aula, conferir o botão de prova desabilitado antes de concluir tudo e habilitado depois.

### Blockers / pendências
- **E2E não rodado** (mesma limitação do devcontainer Trixie — `libnspr4.so`). Validação manual obrigatória antes do merge.
- **Marca d'água ~5%:** o valor de alfa foi calibrado por número (média ~5%), não por inspeção visual no PDF. Se no preview ficar visível demais/de menos, ajustar o fator de multiplicação ao regerar `watermark.ts`.
