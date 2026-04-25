# plan.md — Roadmap por fases

> Cada fase = uma branch `feature/*` contra `develop`. Cada fase tem **critério de aceite claro**. Só avance quando a fase anterior estiver mergeada em `develop` com CI verde.

---

## Status

- [x] **F0** — Bootstrap
- [x] **F1** — Auth + Shell do Admin
- [x] **F2** — CMS de Cursos (CRUD + Uploads)
- [x] **F3** — Catálogo Público + Player + Progresso
- [ ] **F3.5** — Rebrand Ativa Engenharia + Landing Institucional
- [ ] **F4** — Prova + Pix + Certificado + Verificação
- [ ] **F5** — Polish (SEO básico, a11y, rate limit, LGPD, docs de deploy)

---

## F0 — Bootstrap ✅ MERGEADA

**Branch:** `feature/bootstrap`
**Objetivo:** Projeto de pé, rodando localmente via dev container, CI configurado.

### Escopo
- `pnpm init` + Next.js 15 (App Router, TS strict, Tailwind v4, src dir)
- Biome (config + scripts)
- Vitest + Playwright (setup mínimo)
- shadcn/ui (init + instalar `button`, `input`, `label`, `dialog`, `form`, `toast`)
- Prisma (init, schema só com `AdminUser`, primeira migration, seed placeholder)
- `src/lib/db.ts` (singleton)
- `.env.example` completo
- Dev container: `Dockerfile` (Node 20 + pnpm + cloudflared), `docker-compose.yml` (Postgres 16), `devcontainer.json`
- `.github/workflows/ci.yml`: typecheck + lint + test em cada PR/push
- `.github/pull_request_template.md`
- `README.md` com: como rodar, como abrir dev container, comandos principais
- Entrada inicial em `task.md`

### Critério de aceite
- [x] `pnpm dev` sobe em http://localhost:3000 com página placeholder
- [x] `pnpm gates` passa sem erro
- [x] Dev container abre, roda `pnpm dev` dentro dele, Postgres responde
- [x] CI verde no PR
- [x] `task.md` tem entrada da fase

---

## F1 — Auth + Shell do Admin ✅ MERGEADA

**Branch:** `feature/auth-admin`
**Objetivo:** Admin único conseguir logar e ver um dashboard vazio.

### Escopo
- Auth.js v5 com Credentials provider
- `src/lib/auth.ts` + `src/app/api/auth/[...nextauth]/route.ts`
- `src/middleware.ts` protegendo `/admin/*` (exceto `/admin/login`)
- `/admin/login` (página pública com form)
- `/admin` (dashboard vazio com "Olá, Jorge", cards de métricas com valores mocados)
- Layout do admin (`src/app/admin/(dashboard)/layout.tsx`) com sidebar: Cursos, Alunos, Sair
- Seed real do admin com argon2 (usa `ADMIN_SEED_EMAIL` e `ADMIN_SEED_PASSWORD` do `.env`)
- Script `pnpm admin:reset-password` (CLI tsx, interativo, atualiza `passwordHash`)
- E2E: login happy path + login com senha errada
- Atualizar `task.md`

### Critério de aceite
- [x] Login com `jorgemetrimiranda@gmail.com` / `31415926` entra no `/admin`
- [x] Senha errada mostra erro amigável
- [x] Tentar acessar `/admin` sem logar redireciona pra `/admin/login`
- [x] `pnpm admin:reset-password` funciona
- [x] E2E passa

---

## F2 — CMS de Cursos ✅ MERGEADA

**Branch:** `feature/cms-cursos`
**Objetivo:** Admin consegue criar curso completo (módulos, aulas com vídeo, material lateral, banco de questões).

### Escopo
- Schema Prisma completo (Course, Module, Lesson, Question, e stubs para Enrollment/LessonView/ExamAttempt/Payment/Certificate)
- Migration + seed com 1 curso de exemplo publicado
- `src/lib/r2.ts` + endpoint `POST /api/admin/r2/presign`
- `src/lib/bunny.ts` + endpoint `POST /api/admin/bunny/create-video`
- `/admin/cursos` — lista com "Novo curso"
- `/admin/cursos/novo` e `/admin/cursos/[id]/editar` — form com Zod validation
- `/admin/cursos/[id]` — tela de edição estruturada com módulos + lições
- `/admin/cursos/[id]/questoes` — CRUD de banco de questões
- E2E: criar curso, adicionar módulo, aula, questão, publicar
- Atualizar `task.md`

### Critério de aceite
- [x] Admin cria um curso do zero e publica
- [x] Consegue subir vídeo (mesmo que pequeno) pro Bunny direto do navegador
- [x] Tiptap salva e reabre com conteúdo preservado
- [x] Banco de questões funciona
- [x] Preço e carga horária são campos do curso, não globais

---

## F3 — Catálogo Público + Player + Progresso ✅ MERGEADA

**Branch:** `feature/catalogo-player`
**Objetivo:** Aluno sem conta navega, assiste aulas, progresso é rastreado.

### Escopo
- `/` — home pública dark mode com hero do curso featured + rows por categoria
- `/cursos/[slug]` — página do curso com hero + lista de módulos/aulas
- Modal de captura de email + `POST /api/enrollment` idempotente
- `/cursos/[slug]/aulas/[lessonId]` — player + sidebar Tiptap renderer
- `POST /api/progress` com tracking dwell focado, monotônico no servidor
- `GET /api/enrollment/state` para repuxar progresso após reload
- E2E: aluno navega do catálogo → curso → aula, progresso é salvo
- Atualizar `task.md`

### Critério de aceite
- [x] Home mostra cursos publicados organizados por categoria
- [x] Dark mode consistente no lado público
- [x] Aluno informa email 1 vez
- [x] Reload da página mantém o progresso (via banco)
- [x] Aulas completadas aparecem marcadas

---

## F3.5 — Rebrand Ativa Engenharia + Landing Institucional 🚀 PRÓXIMA

**Branch:** `feature/rebrand-landing`
**Objetivo:** Substituir identidade "Netflix-Cursos" pela marca real **Ativa Engenharia**, criar páginas institucionais (Home, Serviços, Quem Somos, FAQ, Contato), e mover o catálogo de cursos pra `/cursos`.

### Contexto
Na F3, descobriu-se que a Ativa Engenharia não é apenas uma escola de cursos — é uma empresa de engenharia (climatização, elétrica, mecânica, civil, segurança do trabalho) que oferece cursos online como produto adicional. O site precisa apresentar a empresa institucionalmente, mas mantendo o foco no funil de cursos (CTA principal "Ver cursos"). Detalhes em `SPEC.md` §1, §3.3, ADR-009, ADR-010, ADR-011.

### Escopo

**Rebrand global**
- `package.json`: `"name": "ativa-engenharia"`
- `README.md`: trocar todas as referências "Netflix-Cursos" por "Ativa Engenharia"
- `CLAUDE.md`: idem
- Banco de dados: renomear de `netflix_cursos` para `ativa_engenharia` (atualizar `DATABASE_URL` no `.env.example` + dev container `docker-compose.yml`)
- localStorage: `netflix_cursos_email` → `ativa_engenharia_email` (com migração on-read se chave antiga existir, copia + apaga)
- `R2_BUCKET` no `.env.example`: `netflix-cursos` → `ativa-engenharia`
- `RESEND_FROM`: trocar pra `Ativa Engenharia <no-reply@ativaengenharia.net>`
- Metadata global (`<title>`, `<meta description>`) com nome novo
- Componente de header e sidebar admin com texto novo

**Tipografia + paleta**
- Adicionar Inter via `next/font/google` no `RootLayout`
- Atualizar `globals.css` / Tailwind config com tokens da paleta azul-marinho:
  - `--primary: #1E3A5F`
  - `--primary-foreground: #FFFFFF`
  - `--accent: #3D5A80`
  - Versões dark e light dos demais tokens (background, foreground, muted, border, ring) calibradas pelo símbolo da logo
- Substituir font-heading serifada por Inter em ambos os temas

**Tema híbrido (light/dark por rota)**
- Páginas institucionais (`/`, `/servicos`, `/quem-somos`, `/faq`, `/contato`) em **light mode**
- App de cursos (`/cursos`, `/cursos/[slug]`, `/cursos/[slug]/aulas/[id]`) e admin (`/admin/*`) em **dark mode**
- `<PublicHeader/>` detecta `usePathname()` e adapta:
  - Estilo do header (light vs dark)
  - Versão da logo (escura sobre fundo claro / clara sobre fundo escuro)

**Reestruturação de rotas**
- Mover home `/` (atual catálogo Netflix) → `/cursos` (catálogo)
- Criar `/` nova (landing institucional)
- Criar `/servicos`, `/quem-somos`, `/faq`, `/contato`
- Atualizar todos os links internos (CTAs, navegação, breadcrumbs)
- Adaptar `tests/e2e/public-catalog.spec.ts`: assertions que esperavam catálogo em `/` agora vão pra `/cursos`

**Componentes novos**
- `<PublicHeader/>` reescrito com menu (Home, Serviços, Cursos, Quem Somos, FAQ, Contato), mobile drawer, item ativo destacado
- `<PublicFooter/>` com 4 colunas: navegação, contato (WhatsApp 27 99818-3686, email, Instagram), responsáveis técnicos com CREA, selos institucionais
- `<HeroCarousel/>` com `embla-carousel-react` + autoplay 5s, setas, dots, respeita `prefers-reduced-motion`
- `<ServiceCard/>` para listar serviços agrupados
- `<FaqAccordion/>` usando `<Accordion/>` do shadcn
- `<ContactForm/>` com Zod + `mailto:` action
- `<WhatsAppButton/>` reutilizável

**Páginas**

`/` (Home institucional, light)
- Hero com `<HeroCarousel/>` (imagens em `public/images/landing/`)
- Headline: "Soluções integradas em engenharia: segurança, qualidade e excelência"
- Subhead curto sobre a empresa
- 2 CTAs: "Ver cursos" (primary → `/cursos`) + "Solicitar orçamento" (outline → `/contato`)
- Seção "Por que Ativa Engenharia" — 4 cards (Confiabilidade, Qualidade, Segurança, Inovação Tecnológica)
- Seção "Cursos em destaque" — 3 cards verticais 2:3 com link "Ver todos os cursos"
- Seção "Conheça nossos serviços" — preview com 6 serviços + link "Ver todos"
- Seção "Selos e certificações" — CREA-ES, ABNT, Bombeiros ES (logos em escala de cinza claro)
- `<PublicFooter/>` (já listado)

`/servicos` (light)
- Hero compacto "Nossos Serviços"
- Categorias agrupadas (Climatização, Elétrica, Mecânica, Civil & Hidráulica, Segurança do Trabalho, Outros)
- Lista de serviços fonte: `src/content/services.ts` com os ~20 serviços do PDF
- CTA fixo no fim: "Solicite um orçamento" → `/contato`

`/cursos` (catálogo Netflix, dark) — **substitui a home dark anterior**
- Hero secundário curto ("Catálogo de Cursos")
- Filtro de categoria (todas / Civil / Mecânica / Segurança)
- Rows por categoria com **cards verticais 2:3** (em vez de 16:9 da F3)
- Mantém snap-x horizontal
- Sem hero gigante de curso featured (esse fica na home institucional)

`/quem-somos` (light)
- Texto institucional em `src/content/about.ts` (extrai do PDF: missão, visão, diferenciais)
- Seção "Responsáveis Técnicos" com 3 nomes + CREA (fonte `src/content/team.ts`)
- Imagem da equipe (uma das `hero-XX.png`)

`/faq` (light)
- `<FaqAccordion/>` com 8-10 perguntas placeholder em `src/content/faq.ts`
- Texto editável depois pelo Jorge

`/contato` (light)
- `<ContactForm/>` (nome, email, telefone, mensagem) com `mailto:ativaengmec@gmail.com`
- `<WhatsAppButton/>` grande verde com mensagem pré-preenchida
- Card de contatos diretos: WhatsApp **27 99818-3686** (visível), email, Instagram @ativaeng, site

**Conteúdo (TS, não DB)**
- `src/content/services.ts` — array de serviços agrupados por categoria
- `src/content/team.ts` — 3 responsáveis técnicos
- `src/content/about.ts` — texto extraído do PDF
- `src/content/faq.ts` — perguntas/respostas placeholder
- `src/content/contact.ts` — WhatsApp, email, Instagram, site
- `src/content/seals.ts` — CREA-ES, ABNT, Bombeiros ES (texto + posição)

**Cleanup**
- `src/components/public/header.tsx` reescrito (não é mais um logo simples, agora é menu)
- `src/components/public/hero-section.tsx` da F3 — adaptar pra ser usado em `/cursos` (sem hero featured grande) ou substituir
- `src/components/public/course-card.tsx` — variant `vertical-poster` (2:3) além da existente

**Testes**
- E2E novo (`tests/e2e/public-landing.spec.ts`):
  - `/` renderiza header com Home/Serviços/Cursos/Quem Somos/FAQ/Contato
  - `/` mostra hero institucional + CTA "Ver cursos"
  - Click "Ver cursos" leva pra `/cursos` em dark mode
  - `/contato` tem botão WhatsApp clicável com `href="https://wa.me/5527998183686..."`
  - `/servicos` lista serviços por categoria
- E2E adaptado (`tests/e2e/public-catalog.spec.ts`):
  - Renomeada/ajustada: assertions de catálogo agora rodam contra `/cursos`, não `/`
  - Modal de email key migrada (`localStorage["ativa_engenharia_email"]`)
- Unit novos (Vitest): pelo menos 2 (helpers de tema/rota, helpers de WhatsApp URL)

**Documentação**
- `task.md`: nova entrada F3.5 com decisões, arquivos tocados, blockers
- `CLAUDE.md`: atualizar referências ao nome do projeto se houver

### Critério de aceite
- [ ] `pnpm dev` sobe em `http://localhost:3000`, `/` mostra landing institucional Ativa Engenharia em light mode com carrossel funcionando
- [ ] Menu do header tem 6 itens (Home, Serviços, Cursos, Quem Somos, FAQ, Contato), todos navegam corretamente
- [ ] `/cursos` continua funcionando em dark mode com catálogo Netflix de cards verticais
- [ ] `/cursos/[slug]` e `/cursos/[slug]/aulas/[id]` continuam funcionando como na F3 (sem regressão)
- [ ] Tema troca automaticamente quando usuário navega entre rotas institucionais e rotas de cursos
- [ ] Logo aparece corretamente em ambos os temas (versão clara em fundo escuro, versão escura em fundo claro)
- [ ] WhatsApp 27 99818-3686 é clicável em footer e em `/contato`
- [ ] `/quem-somos` mostra os 3 responsáveis técnicos com CREA
- [ ] `/servicos` lista os ~20 serviços do PDF agrupados por categoria
- [ ] `pnpm gates` verde
- [ ] `pnpm test:e2e` verde (todos os testes anteriores + novos da F3.5)
- [ ] Banco renomeado de `netflix_cursos` para `ativa_engenharia` sem perda de dados (ou drop+recreate documentado, já que estamos em dev e dados são seed)
- [ ] Nenhuma referência textual a "Netflix-Cursos" sobrevive no código (exceto histórico em `task.md`)
- [ ] `task.md` tem entrada F3.5 documentando decisões e arquivos tocados

### Pré-requisitos antes de rodar
- Logo já em `public/images/brand/logo.png` ✓
- Imagens hero em `public/images/landing/hero-01.png`, `hero-02.png` ✓
- PDF da empresa lido e conteúdo extraído pra `src/content/*.ts` durante a fase

---

## F4 — Paywall + Prova + Certificado + Verificação 🚀 PRÓXIMA

**Branch:** `feature/paywall-prova-cert`
**Objetivo:** paywall total — 1 Pix libera curso vitalício e emite certificado automático quando aluno passa na prova. Gateway via adapter pattern (AbacatePay default).

### Contexto

ADR-012 (paywall total) e ADR-013 (gateway adapter) documentados em SPEC.md §6. Modelo: aluno informa email+nome+CPF, paga 1 Pix, ganha acesso vitalício + certificado pós-prova-passada. Nota mínima default 6.0 (campo por curso). AbacatePay como gateway primário (taxa R$ 0,80, DX superior). CNPJ Ativa 29.974.056/0001-29 (LTDA desde 2018) passa KYC sem fricção.

### Escopo (7 commits)

**C1 — Cleanup pre-paywall**
- Typo "questãos" → "questões" no admin de banco de questões
- Subhead `/cursos` atualizada pra refletir paywall
- `scripts/cleanup-test-courses.ts` + `pnpm db:cleanup-test-courses`

**C2 — Schema F4**
- Migration: enum `EnrollmentStatus` (`pending_payment`|`active`|`cancelled`)
- `Enrollment.status` default `pending_payment`
- Grandfathering: enrollments F3 viram `active`
- `Course.examPassScore` default `6.0`

**C3 — Payment Gateway adapter (ADR-013)**
- `src/lib/payments/types.ts` — interface + erros tipados
- `src/lib/payments/abacatepay.ts` — implementação AbacatePay (createPix via `/pixQrCode/create`, getStatus via `/pixQrCode/check`, verifyWebhook HMAC SHA-256)
- `src/lib/payments/index.ts` — factory `getPaymentGateway()`
- `.env.example` com 4 vars novas
- Tolerância: vars vazias → `GatewayNotConfiguredError` → 503 amigável
- Testes unit cobrindo factory + verifyWebhook + status mapping

**C4 — Access gates**
- `src/lib/access.ts` — `getEnrollment()` + `hasAccess()`
- `/cursos/[slug]` Server + `<CourseDetailGate/>` Client com CTA dinâmico
- `<LessonAccessGate/>` envolve `<LessonView/>` — bloqueia sem `status='active'`
- `POST /api/enrollment` muda comportamento: só consulta, não cria
- `POST /api/progress`, `GET /api/enrollment/state`, `POST /api/exam/*` ganham guard
- Modal de email da F3 fica obsoleto (remover)
- E2E adaptado: "Comprar acesso" leva pra checkout, não pra modal

**C5 — Checkout Pix**
- `src/lib/cpf.ts` — validateCpf, maskCpf, testes unit
- `POST /api/checkout/create` — Zod, cria Enrollment+Payment, chama gateway, retorna QR
- `GET /api/checkout/status/[id]` — lazy expiry, lê só do banco
- `/cursos/[slug]/comprar` + `<CheckoutForm/>` (email+nome+CPF+LGPD)
- `/cursos/[slug]/comprar/pix` — QR base64 + brCode copia-e-cola + contador 30min + polling 3s

**C6 — Prova + emissão automática de certificado**
- `POST /api/exam/start` (sorteio random, hide isCorrect)
- `POST /api/exam/submit` (correção server-side, dispara `issueCertificateIfNeeded()` se passou)
- `src/lib/certificates.ts` — `issueCertificateIfNeeded` idempotente
- `src/lib/pdf/CertificateTemplate.tsx` — `@react-pdf/renderer` A4 paisagem com logo, dados, selos, QR, assinatura
- `src/lib/email/CertificateIssued.tsx` + `src/lib/email.ts` — Resend, best-effort
- `/cursos/[slug]/aulas/prova` + `<ExamView/>`
- `/cursos/[slug]/certificado` — preview + download
- Deps: `@react-pdf/renderer`, `qrcode`, `@types/qrcode`

**C7 — Webhook + verificar público**
- `POST /api/payments/webhook` — raw body, HMAC verify, idempotente, só ativa enrollment (não emite cert)
- `/verificar/[codigo]/page.tsx` — SSR público, light theme
- E2E final cobrindo paywall flow

### Critério de aceite

- [ ] `pnpm gates` + `pnpm test:e2e` verdes
- [ ] Aluno sem enrollment ativo não acessa aula (tela bloqueada)
- [ ] `validateCpf` rejeita DV errado e todos-iguais
- [ ] Pix renderiza QR + brCode + contador
- [ ] Polling 3s detecta approved e redireciona
- [ ] Webhook HMAC valida e é idempotente
- [ ] Prova destrava só com `status='active'` E todas aulas concluídas
- [ ] Certificado emitido automaticamente, sem 2º pagamento
- [ ] PDF com logo, dados, QR, selos, assinatura
- [ ] `/verificar/[codigo]` funciona publicamente
- [ ] Sem credenciais → 503 amigável (não 500)
- [ ] `task.md` documenta F4

### Pré-requisitos antes de rodar

- Credenciais AbacatePay dev mode (Jorge cria conta, ~5 min, sem CNPJ ainda)
- (Opcional pra dev) Resend API key + R2 credentials — sem elas, cert é criado mas pdfUrl=null e email é skipado com warning

## F5 — Polish

**Branch:** `feature/polish`
**Objetivo:** Deixar pronto pra mostrar pro mundo.

### Escopo
- SEO básico: `metadata` por página pública, `sitemap.ts`, `robots.ts`, OpenGraph
- Acessibilidade: passar axe-core nas páginas críticas, focar teclado em modais e carrossel, alt em imagens
- Rate limiting em rotas sensíveis (`/api/pix/create`, `/api/enrollment`, `/api/auth/*`)
- Página de privacidade (`/privacidade`) + consentimento no modal de email (checkbox LGPD já existe da F3)
- Página 404 e error boundary customizados (com identidade Ativa)
- Backend SMTP no `<ContactForm/>` (Resend)
- Script de backup do Neon documentado no `README`
- `README.md` completo: setup local, credenciais externas, deploy Vercel, webhook MP, reset senha admin
- `docs/` com screenshots
- Lighthouse ≥ 90 em perf/SEO/a11y nas páginas públicas principais
- Atualizar `task.md`

### Critério de aceite
- [ ] Lighthouse ≥ 90 nas 3 categorias principais
- [ ] Axe não acusa violação crítica
- [ ] Rate limit devolve 429 quando abusado
- [ ] README permite que alguém novo consiga rodar o projeto em < 30 min

---

## Como medir progresso

No topo deste arquivo, o bloco "Status" deve ter o checkbox marcado quando a fase for mergeada em `develop` com CI verde. Um release candidate sobe pra `main` quando F5 concluir (tag `v0.1.0`).

---

## O que NÃO está no plano (explicitamente)

- Sistema de cupom de desconto
- Integração com Google Classroom ou LMS externos
- Reviews/avaliações de cursos
- Fórum ou chat
- Upload de avatar/foto do aluno
- Dashboard de analytics avançado
- CMS de páginas institucionais (textos ficam em TS sob `src/content/`)
- Sistema de orçamento online (botão WhatsApp resolve)

Se surgir necessidade real: cria-se nova fase (F6+) ou entra em backlog no `SPEC.md` seção "Backlog futuro".