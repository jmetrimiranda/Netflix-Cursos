# plan.md — Roadmap por fases

> Cada fase = uma branch `feature/*` contra `develop`. Cada fase tem **critério de aceite claro**. Só avance quando a fase anterior estiver mergeada em `develop` com CI verde.

---

## Status

- [ ] **F0** — Bootstrap
- [ ] **F1** — Auth + Shell do Admin
- [ ] **F2** — CMS de Cursos (CRUD + Uploads)
- [ ] **F3** — Catálogo Público + Player + Progresso
- [ ] **F4** — Prova + Pix + Certificado + Verificação
- [ ] **F5** — Polish (SEO básico, a11y, rate limit, LGPD, docs de deploy)

---

## F0 — Bootstrap

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
- [ ] `pnpm dev` sobe em http://localhost:3000 com página placeholder
- [ ] `pnpm gates` passa sem erro
- [ ] Dev container abre, roda `pnpm dev` dentro dele, Postgres responde
- [ ] CI verde no PR
- [ ] `task.md` tem entrada da fase

---

## F1 — Auth + Shell do Admin

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
- [ ] Login com `jorgemetrimiranda@gmail.com` / `31415926` entra no `/admin`
- [ ] Senha errada mostra erro amigável
- [ ] Tentar acessar `/admin` sem logar redireciona pra `/admin/login`
- [ ] `pnpm admin:reset-password` funciona (testar mudando a senha e relogando)
- [ ] E2E passa

---

## F2 — CMS de Cursos

**Branch:** `feature/cms-cursos`
**Objetivo:** Admin consegue criar curso completo (módulos, aulas com vídeo, material lateral, banco de questões).

### Escopo
- Schema Prisma completo (Course, Module, Lesson, Question, e stubs para Enrollment/LessonView/ExamAttempt/Payment/Certificate — a serem usados nas fases seguintes)
- Migration + seed com 1 curso de exemplo publicado (ajuda no dev das fases seguintes)
- `src/lib/r2.ts` (S3 client configurado pro R2) + endpoint `POST /api/admin/r2/presign`
- `src/lib/bunny.ts` + endpoint `POST /api/admin/bunny/create-video`
- `/admin/cursos` — lista com "Novo curso"
- `/admin/cursos/novo` e `/admin/cursos/[id]/editar` — form com Zod validation
  - Campos: título, slug (auto-gerado editável), descrição, categoria (select), preço em BRL (mask), carga horária (horas), `examQuestionsCount`, `examPassScore`, thumbnail (upload R2), published (toggle)
- `/admin/cursos/[id]` — tela de edição estruturada:
  - Seção "Módulos" com reorder (dnd-kit ou similar) + CRUD
  - Dentro de cada módulo: CRUD de Lesson
    - Upload TUS de vídeo pro Bunny (componente `<VideoUploader>` com barra de progresso)
    - Editor Tiptap pro `sidebarContent`
    - Upload opcional de PDF
- `/admin/cursos/[id]/questoes` — CRUD de banco de questões
- E2E: criar curso, adicionar módulo, aula (com upload mockado), questão, publicar
- Atualizar `task.md`

### Critério de aceite
- [ ] Admin cria um curso do zero e publica
- [ ] Consegue subir vídeo (mesmo que pequeno, MP4) pro Bunny direto do navegador
- [ ] Tiptap salva e reabre com conteúdo preservado
- [ ] Banco de questões tem ao menos 10 itens
- [ ] Preço e carga horária são campos do curso, não globais

---

## F3 — Catálogo Público + Player + Progresso

**Branch:** `feature/catalogo-player`
**Objetivo:** Aluno sem conta navega, assiste aulas, progresso é rastreado.

### Escopo
- `/` — home pública com dark mode
  - Hero (imagem + copy do curso em destaque do admin — adicionar campo `featured` em Course)
  - Rows por categoria ("Engenharia Civil", "Engenharia Mecânica", "Segurança do Trabalho") em carrosséis horizontais
  - Cards estilo Netflix (thumb, título, duração total, "X aulas")
- `/cursos/[slug]` — página do curso
  - Hero com thumb, descrição, botão "Começar curso"
  - Lista de módulos e aulas
- Modal de captura de email na primeira interação
  - Salva em `localStorage` como `studentEmail`
  - `POST /api/enrollment` cria Enrollment (idempotente)
- `/cursos/[slug]/aulas/[lessonId]` — player
  - Bunny Stream embed à esquerda (fallback pra `iframe` se precisar)
  - Sidebar à direita com `sidebarContent` (Tiptap renderer em read-only) + botão download PDF
  - Navegação prev/next
  - Indicador ✓ nas aulas completadas
- `POST /api/progress` (body: `{enrollmentId, lessonId, progressPct}`) — atualiza `LessonView`, seta `completed=true` quando `>= 90`
  - Tracking disparado pelo player a cada 10s e no `timeupdate` final
- E2E: aluno navega do catálogo → curso → aula, progresso é salvo
- Atualizar `task.md`

### Critério de aceite
- [ ] Home mostra cursos publicados organizados por categoria
- [ ] Dark mode consistente no lado público
- [ ] Aluno informa email 1 vez, não é perguntado de novo na mesma sessão
- [ ] Reload da página mantém o progresso (via `LessonView` no banco, não só localStorage)
- [ ] Aulas completadas aparecem marcadas

---

## F4 — Prova + Pix + Certificado + Verificação

**Branch:** `feature/prova-pix-cert`
**Objetivo:** Fluxo end-to-end: prova → pagamento → certificado emitido e verificável.

### Escopo
- Destravamento da prova:
  - `/cursos/[slug]/aulas/prova` só libera se todas as `Lesson` do curso têm `LessonView.completed=true` para o email atual
  - Caso contrário: tela "Você ainda precisa concluir X aulas"
- Prova:
  - `POST /api/exam/start` sorteia N questões, cria `ExamAttempt`
  - Renderização da prova (1 questão por vez ou lista — a decidir durante o desenvolvimento, default lista)
  - `POST /api/exam/submit` corrige, grava `score` e `passed`
  - Tela de resultado: passou ou não
- Fluxo pago:
  - Se passou e ainda não tem `Payment.approved`: mostra CTA "Emitir certificado"
  - Form de dados: nome completo, CPF (com validação de dígitos, máscara no frontend)
  - `POST /api/pix/create` → Mercado Pago → retorna QR code base64 + copia-e-cola + paymentId
  - Tela do Pix: QR, botão copiar, contador regressivo (30min), polling `GET /api/pix/status/[id]` a cada 3s
- Webhook:
  - `POST /api/pix/webhook` valida `x-signature`, busca pagamento na API do MP, atualiza status idempotentemente
- Certificado:
  - Quando `Payment.status` vira `approved` (por polling ou webhook, mesmo handler em `src/lib/certificates.ts::issueCertificate()`):
    - Gera `verificationCode`
    - Renderiza PDF com `@react-pdf/renderer` (template em `src/lib/pdf/CertificateTemplate.tsx`)
    - Upload no R2 em `certificates/<code>.pdf`
    - Cria `Certificate`
    - Envia email via Resend (template em `src/emails/CertificateIssued.tsx`)
  - Idempotência: se `Certificate` já existe pra aquela `Enrollment`, não duplica
- `/cursos/[slug]/certificado` — mostra preview + botão "Baixar PDF" + mensagem "também enviamos pro seu email"
- `/verificar/[codigo]` — SSR, mostra dados do certificado ou "Código inválido"
- E2E:
  - Aluno conclui curso, passa na prova, preenche dados, "paga" via MP sandbox, vê certificado
  - URL de verificação renderiza corretamente
- Atualizar `task.md`

### Critério de aceite
- [ ] Prova não libera com aulas incompletas
- [ ] Resposta com nota < `examPassScore` não permite pagamento
- [ ] Pix gera QR code real (testado em sandbox do MP)
- [ ] Polling atualiza a tela quando pagamento é aprovado
- [ ] Webhook também atualiza (testar desconectando o polling)
- [ ] Certificado PDF tem os dados corretos e QR code de verificação
- [ ] Email chega (testar com MailHog ou Resend em modo test)
- [ ] `/verificar/[codigo]` funciona publicamente

---

## F5 — Polish

**Branch:** `feature/polish`
**Objetivo:** Deixar pronto pra mostrar pro mundo.

### Escopo
- SEO básico: `metadata` por página pública, `sitemap.ts`, `robots.ts`, OpenGraph no catálogo
- Acessibilidade: passar axe-core nas páginas críticas, focar teclado funcionando em modais, alt em imagens
- Rate limiting em rotas sensíveis (`/api/pix/create`, `/api/enrollment`, `/api/auth/*`) com Upstash Ratelimit ou equivalente simples em memória pra começar
- Página de privacidade (`/privacidade`) + consentimento no modal de email (checkbox LGPD)
- Página 404 e error boundary customizados (dark mode)
- Script de backup do Neon documentado no `README`
- `README.md` completo com:
  - Setup local
  - Setup de credenciais externas (links de onde pegar cada uma)
  - Deploy na Vercel (passo a passo)
  - Configuração do webhook do MP em produção
  - Como trocar a senha do admin
- `docs/` com screenshots do admin e do player pro Jorge usar
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

Se surgir necessidade real: cria-se nova fase (F6+) ou entra em backlog no `SPEC.md` seção "Backlog futuro".
