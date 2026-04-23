# SPEC — Netflix-Cursos

> Plataforma de cursos online (engenharia civil, mecânica, segurança do trabalho) com catálogo público estilo Netflix, player com material lateral, prova, e emissão de certificado pago via Pix. Admin único para gestão de cursos.

---

## 1. Visão & Personas

### 1.1 Visão
Uma plataforma leve, moderna, com dois modos:

- **Público (sem conta):** navega pelo catálogo, assiste aulas, faz prova. Só fornece email quando inicia um curso e nome/CPF quando vai comprar o certificado.
- **Admin (um único usuário):** cria/edita cursos, módulos, aulas (com upload de vídeo), material lateral (Tiptap), PDFs, banco de questões.

### 1.2 Personas

| Persona | O que faz |
|---|---|
| **Aluno (público)** | Entra, navega, assiste, faz prova. Paga Pix se quiser certificado. |
| **Admin (Jorge)** | Cria e gerencia cursos. Único admin do sistema. |

### 1.3 Escopo de escala
- Até ~1000 alunos/ano
- ~20–100 sessões simultâneas no pico
- Assumir volumes baixos → priorizar simplicidade operacional sobre otimização prematura

---

## 2. Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript | SOTA pra app + SSR do catálogo + API routes pra webhooks |
| Package manager | pnpm | Rápido, workspace-ready |
| Estilo | Tailwind CSS v4 + shadcn/ui | Componentes acessíveis + customização total |
| Editor rich text | Tiptap | Headless, extensível, padrão de facto |
| DB | PostgreSQL 16 (Neon em prod, docker-compose em dev) | Maduro, free tier generoso |
| ORM | Prisma | DX superior, schema declarativo, migrações automáticas |
| Auth admin | Auth.js (NextAuth v5) — Credentials provider | Simples, suporta 1 usuário fixo |
| Hash senha | argon2 | Padrão OWASP atual |
| Validação | Zod | Tipos inferidos, padrão do ecossistema |
| Vídeo | **Bunny Stream** | Custo-benefício imbatível na escala (~$2–5/mês), CDN, player, TUS upload |
| Object storage | **Cloudflare R2** | S3-compatível, **zero egress**, barato pra PDFs/thumbs/certificados |
| Pagamento Pix | **Mercado Pago** (SDK `mercadopago` v2) | MEI ✓, docs PT-BR, sem mensalidade |
| Email transacional | Resend + React Email | 3000 grátis/mês, templates em JSX |
| Certificado PDF | `@react-pdf/renderer` | Componentes React → PDF, fácil manter |
| Geração QR | `qrcode.react` (fallback se Mercado Pago não retornar base64) | Padrão JS |
| Testes unit | Vitest | Rápido, drop-in do Jest |
| Testes e2e | Playwright | Gold standard |
| Lint + format | Biome | Mais rápido que ESLint+Prettier, config única |
| Deploy app | **Vercel** (Hobby) | SOTA pra Next.js, HTTPS público automático (webhook Pix) |
| Deploy DB | **Neon** (free tier) | Postgres serverless, branching |
| CI | GitHub Actions | Nativo do repo |
| Dev container | VS Code Dev Container (Dockerfile + compose) | Node 20, Postgres 16, cloudflared pré-instalado |

---

## 3. Modelo de Dados

Schema Prisma (resumo conceitual — o schema real vive em `prisma/schema.prisma`).

### 3.1 Entidades

**`AdminUser`** — um único registro
- `id`, `email` (único), `passwordHash`, `createdAt`

**`Course`**
- `id`, `slug` (único, URL-friendly), `title`, `description` (texto longo, markdown)
- `thumbnailUrl` (R2), `category` (`civil` | `mecanica` | `seguranca`)
- `priceCents` (Int, preço do certificado em centavos — definido pelo admin, varia por curso)
- `workloadHours` (Int, definido pelo admin)
- `examQuestionsCount` (Int, quantas questões sorteadas do banco na prova — default 10)
- `examPassScore` (Float, nota mínima — default 7.0 de 10)
- `published` (Boolean, default false)
- `createdAt`, `updatedAt`

**`Module`**
- `id`, `courseId` (FK → Course, cascade delete), `title`, `order` (Int)

**`Lesson`**
- `id`, `moduleId` (FK → Module, cascade), `title`, `order`
- `bunnyVideoId`, `bunnyLibraryId` (refs do Bunny Stream)
- `durationSeconds` (Int, sincronizado do Bunny via webhook)
- `sidebarContent` (Json — documento Tiptap)
- `sidebarPdfUrl` (String?, opcional — URL no R2)

**`LessonView`** — rastreia progresso por email (sem conta)
- `id`, `studentEmail`, `lessonId` (FK → Lesson, cascade)
- `progressPct` (Int, 0–100), `completed` (Boolean, true quando >= 90%)
- `lastWatchedAt`
- `@@unique([studentEmail, lessonId])`

**`Question`** — banco de questões por curso
- `id`, `courseId` (FK, cascade), `statement` (texto), `active` (Boolean)
- `options` (Json — array `[{id, text, isCorrect}]`, 4 opções, 1 correta)

**`Enrollment`** — criado no 1º acesso do aluno ao curso (após email)
- `id`, `studentEmail`, `courseId` (FK), `startedAt`
- `@@unique([studentEmail, courseId])`

**`ExamAttempt`**
- `id`, `enrollmentId` (FK, cascade), `startedAt`, `submittedAt?`
- `score` (Float?), `passed` (Boolean?)
- `answers` (Json — `{questionId: selectedOptionId}`)
- `selectedQuestionIds` (Json — array de IDs sorteados, pra reconstruir a prova)

**`Payment`**
- `id`, `enrollmentId` (FK, único), `mpPaymentId` (único)
- `amountCents`, `status` (`pending` | `approved` | `rejected` | `expired`)
- `qrCode`, `qrCodeBase64`
- `studentName`, `studentCpf` (coletados pré-pagamento, usados no certificado)
- `createdAt`, `paidAt?`, `expiresAt`

**`Certificate`**
- `id`, `enrollmentId` (FK, único)
- `verificationCode` (String único, formato `EC-XXXXXXXX`)
- `pdfUrl` (R2 — **pré-renderizado** após Pix aprovado)
- `studentName`, `studentCpf`, `courseTitle`, `workloadHours`
- `issuedAt`
- **Sem `expiresAt`** → certificado é vitalício

### 3.2 Relações (diagrama textual)

```
AdminUser (1)

Course (1) ─┬─< Module (N) ─< Lesson (N) ─< LessonView (N)
            ├─< Question (N)
            └─< Enrollment (N) ─┬─< ExamAttempt (N)
                                ├── Payment (0..1)
                                └── Certificate (0..1)
```

---

## 4. Fluxos Críticos

### 4.1 Fluxo do aluno (público)

1. Acessa `/` → vê **hero** + **rows por categoria** (estilo Netflix, dark mode).
2. Clica num curso → `/cursos/[slug]`. Vê descrição, módulos, botão "Começar".
3. Ao clicar "Começar" pela 1ª vez → modal pede email. Ao confirmar:
   - `POST /api/enrollment` cria `Enrollment` (se não existir).
   - Salva email no `localStorage` pra reconhecer em visitas futuras.
4. Abre a 1ª aula → `/cursos/[slug]/aulas/[lessonId]`.
   - **Player Bunny Stream** à esquerda.
   - **Sidebar** à direita com `sidebarContent` (Tiptap renderizado) e download do `sidebarPdfUrl` se houver.
   - Progresso é reportado a cada 10s via `POST /api/progress` (body: `{lessonId, pct}`) → atualiza `LessonView`. Ao atingir 90% → `completed=true`.
5. Navegação é livre (pode pular ordem).
6. **Botão "Fazer prova" só fica ativo quando TODAS as `Lesson` do curso estão `completed=true` pra aquele email**.
7. Prova:
   - `POST /api/exam/start` sorteia `examQuestionsCount` questões ativas do curso → cria `ExamAttempt` com `selectedQuestionIds`.
   - Aluno responde → `POST /api/exam/submit` corrige, grava `score` e `passed`.
   - Sem tempo limite. Tentativas ilimitadas (cada submit cria novo `ExamAttempt`).
8. Se `passed` && sem `Payment.approved`:
   - Mostra mensagem "Parabéns, você foi aprovado! Para receber seu certificado, preencha seus dados e faça o pagamento."
   - Formulário pede **nome completo** e **CPF** (validação: dígitos verificadores).
9. **Checkout Pix:**
   - `POST /api/pix/create` com `{enrollmentId, studentName, studentCpf}`:
     - Chama MP API → cria payment com `payment_method_id: "pix"`.
     - Salva `Payment` com `qr_code`, `qr_code_base64`, `expiresAt` (30min).
     - Retorna QR code + `copia-e-cola`.
   - Frontend mostra QR + botão "copiar código" + contador regressivo.
   - **Polling primário:** frontend chama `GET /api/pix/status/[paymentId]` a cada 3s.
     - Endpoint consulta MP API (`payment.get`) e atualiza `Payment.status` no banco.
   - **Webhook secundário (redundância):** `POST /api/pix/webhook` recebe notificações do MP, valida assinatura HMAC (x-signature), busca na API, atualiza status. Idempotente.
10. Quando `status=approved`:
    - Emite certificado (ver 4.3).
    - Redireciona pra `/cursos/[slug]/certificado` que mostra preview + botão de download + mensagem "Enviamos pro seu email também".

### 4.2 Fluxo do admin

1. `/admin/login` → credenciais.
2. `/admin` → dashboard com cards: total de cursos, alunos (distinct `studentEmail` em `Enrollment`), certificados emitidos, receita acumulada (sum `Payment.amountCents` onde `status=approved`).
3. `/admin/cursos` → lista com CRUD. Criar/editar:
   - Dados do curso (título, descrição, preço em BRL, carga horária, categoria).
   - Upload de thumbnail → frontend pega **URL pre-signed do R2** via `POST /api/admin/r2/presign`, faz PUT direto pro R2.
   - Publicar (toggle `published`).
4. `/admin/cursos/[id]` → edita módulos e aulas:
   - CRUD de `Module` (drag-to-reorder).
   - CRUD de `Lesson`:
     - Upload de vídeo → **direto pro Bunny via TUS** (não passa pelo Vercel). Backend chama `POST /api/admin/bunny/create-video` pra obter `videoId` + `uploadUrl`. Cliente faz upload TUS resumível. Ao terminar, backend salva `bunnyVideoId` e `bunnyLibraryId` na `Lesson`.
     - Editor Tiptap pro `sidebarContent`.
     - Upload opcional de PDF → R2 (mesmo fluxo da thumbnail).
5. `/admin/cursos/[id]/questoes` → CRUD de banco de questões (enunciado + 4 opções + marca a correta).
6. `/admin/alunos` → lista distinct emails com: cursos iniciados, provas feitas, certificados pagos.

### 4.3 Emissão do certificado (pós-Pix aprovado)

1. Trigger: `Payment.status` vira `approved` (via polling ou webhook — ambos idempotentes).
2. Gera `verificationCode` (`EC-` + 8 chars aleatórios base32).
3. Renderiza PDF com `@react-pdf/renderer`:
   - Template único (`src/lib/pdf/CertificateTemplate.tsx`).
   - Dados dinâmicos: `studentName`, `studentCpf`, `courseTitle`, `workloadHours`, `issuedAt` formatada em PT-BR, `verificationCode`, QR code apontando pra `https://<domínio>/verificar/<code>`.
4. Upload do buffer pro R2 em `certificates/<verificationCode>.pdf` → salva `pdfUrl`.
5. Cria `Certificate` no banco.
6. Envia email via Resend com link pro PDF (template em `src/emails/CertificateIssued.tsx`).
7. Frontend detecta status via polling → redireciona pra tela do certificado.

### 4.4 Verificação pública

- `/verificar/[codigo]` (SSR):
  - Busca `Certificate` por `verificationCode`.
  - Se encontra: mostra página com dados (nome, curso, carga horária, data, ✓ válido).
  - Se não: "Código inválido."

---

## 5. Regras de Negócio (resumo)

- Nota mínima aprovação: **campo `examPassScore` por curso, default 7.0**.
- Questões sorteadas por prova: **campo `examQuestionsCount` por curso, default 10**.
- Tentativas de prova: **ilimitadas**, sem cooldown.
- Aluno deve ter TODAS as lições do curso com `LessonView.completed=true` pra destravar a prova.
- Certificado só é emitido se: `ExamAttempt.passed=true` E `Payment.status=approved`.
- Certificado é **vitalício** (sem `expiresAt`).
- Admin é **único** — não há multi-tenancy.
- Preço do certificado é **por curso**, em centavos de BRL, definido pelo admin.
- Se o aluno já tem `Payment.status=approved` e ganhou certificado, não pode re-pagar.

---

## 6. ADRs (Architectural Decision Records)

### ADR-001: Vídeo no Bunny Stream em vez de self-host ou Mux
**Contexto:** preciso host de vídeo barato pra ~1000 usuários/ano, com player embed e CDN.
**Decisão:** Bunny Stream.
**Justificativa:** Mux começa em ~$20/mês; Cloudflare Stream cobra $5/1k min armazenados; Bunny custa ~$0.005/GB armazenado + $0.01/GB entregue → estimado $2–5/mês pro projeto. Player incluso, API simples, TUS pra upload resumível. Self-host (S3+HLS+FFmpeg) traz complexidade desproporcional ao volume.
**Consequências:** Lock-in leve no Bunny (mas vídeos podem ser re-exportados se migrar).

### ADR-002: R2 em vez de S3/Supabase Storage
**Contexto:** storage pra PDFs, thumbs, certificados.
**Decisão:** Cloudflare R2.
**Justificativa:** Egress zero (baixa estrutura de custos pra downloads de certificados). S3-compatível (troca de provider é 1 linha). Mais barato que S3 e Supabase Storage na faixa de uso.
**Consequências:** Precisa conta Cloudflare (que já vai existir se usar Workers no futuro).

### ADR-003: Mercado Pago para Pix
**Contexto:** receber Pix no Brasil, MEI.
**Decisão:** Mercado Pago (SDK oficial Node).
**Justificativa:** MEI ✓, sem mensalidade, docs em PT-BR, maior ecossistema de exemplos no Brasil, webhook bem documentado.
**Consequências:** Taxa por transação (~0.99%). Webhook precisa verificação HMAC (`x-signature`). Em dev, webhook testado via `cloudflared tunnel` (incluso no dev container) ou — mais simples — via polling como canal primário.

### ADR-004: Polling como canal primário de status Pix, webhook como redundância
**Contexto:** Status do pagamento tem que chegar ao frontend. Webhooks são mais elegantes mas exigem URL pública em dev.
**Decisão:** Frontend faz polling a cada 3s em `/api/pix/status/[id]` (que consulta MP direto). Webhook também existe, valida assinatura, é idempotente, e serve como reforço.
**Justificativa:** Na escala (20–100 simultâneos), polling de 3s é trivial. Remove complexidade de túnel em dev. Webhook garante que o status é atualizado mesmo se o aluno fechar a aba.
**Consequências:** Ambos caminhos atualizam o mesmo registro `Payment` — operações devem ser idempotentes (use `UPDATE WHERE status != 'approved'`).

### ADR-005: Certificado pré-renderizado em vez de on-demand
**Contexto:** Certificado é imutável. Pode ser gerado 1x ou toda vez que o aluno pedir.
**Decisão:** Gerar 1x após Pix aprovado, salvar no R2, reusar a URL.
**Justificativa:** Imutabilidade garantida (hash do PDF é estável), latência zero no download, custo de CPU baixo, URL de verificação simples.
**Consequências:** Storage cresce linearmente com certificados emitidos (cada PDF ~50–100 KB → 1000 certs = ~100 MB/ano, trivial).

### ADR-006: Upload de vídeo direto pro Bunny (TUS), não pelo Vercel
**Contexto:** Vercel serverless tem limite de 4.5 MB em payloads; vídeos são grandes.
**Decisão:** Cliente faz TUS upload direto pro Bunny. Backend só orquestra.
**Justificativa:** Padrão SOTA (Mux, Bunny, YouTube fazem igual). Evita timeout. UI de progresso funciona nativamente com TUS.
**Consequências:** Admin precisa conectividade decente pra upload. Sem retry automático no nosso lado (mas TUS é resumível).

### ADR-007: Auth.js (NextAuth v5) com Credentials provider, apenas 1 admin
**Contexto:** Só 1 admin, sem registro público, sem OAuth.
**Decisão:** Auth.js v5 + Credentials. Seed cria o admin único no `prisma/seed.ts`.
**Justificativa:** Auth.js é o padrão do ecossistema Next. Credentials é trivial pra 1 user. Senha hasheada com argon2.
**Consequências:** Se no futuro quiser múltiplos admins, só remover a constraint de seed — a tabela já existe.

### ADR-008: Prisma em vez de Drizzle
**Contexto:** ORM TypeScript.
**Decisão:** Prisma.
**Justificativa:** Usuário conhece JS e Python — Prisma tem melhor DX (schema declarativo legível, migrações automáticas, Studio pra debug). Drizzle é mais performático mas tem curva maior.
**Consequências:** Build size um pouco maior (irrelevante aqui).

---

## 7. Variáveis de Ambiente

Documentar em `.env.example` no repo (sem valores reais).

```env
# --- Next / App ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# --- Database (Neon em prod, docker-compose em dev) ---
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/netflix_cursos

# --- Auth.js ---
AUTH_SECRET=  # pnpm dlx auth secret
AUTH_TRUST_HOST=true
ADMIN_SEED_EMAIL=jorgemetrimiranda@gmail.com
ADMIN_SEED_PASSWORD=31415926  # TROCAR após primeiro login

# --- Mercado Pago ---
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx  # TEST- em dev, APP_USR- em prod
MERCADOPAGO_WEBHOOK_SECRET=          # Suas integrações > Webhooks > Secret

# --- Bunny Stream ---
BUNNY_STREAM_API_KEY=
BUNNY_STREAM_LIBRARY_ID=
BUNNY_CDN_HOSTNAME=                  # ex: vz-xxxx.b-cdn.net

# --- Cloudflare R2 ---
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=netflix-cursos
R2_PUBLIC_URL=                       # ex: https://pub-xxxx.r2.dev ou domínio custom

# --- Resend ---
RESEND_API_KEY=
RESEND_FROM=Netflix Cursos <no-reply@placeholder.com>
```

---

## 8. Não-objetivos (explicitamente fora)

- Multi-admin / permissionamento granular
- Contas de aluno com login/senha
- Recurring subscriptions / cobrança recorrente
- Streaming ao vivo
- App mobile nativo
- Múltiplos idiomas (só PT-BR)
- SEO avançado (sitemap + metadata básicos bastam)
- Analytics (Posthog/Plausible etc.)

---

## 9. Riscos conhecidos

| Risco | Mitigação |
|---|---|
| Admin esquece senha | Seed idempotente + endpoint CLI `pnpm admin:reset-password` (documentado no README) |
| Webhook MP chega duplicado | Toda atualização é `UPDATE WHERE status != 'approved'` (idempotente) |
| Aluno perde acesso ao certificado | `verificationCode` é permanente; `/verificar/[codigo]` público; email fica no inbox |
| Upload de vídeo trava meio do caminho | TUS é resumível; admin pode retomar |
| Preço muda depois da venda | `Payment.amountCents` guarda o valor no momento da compra (snapshot) |
| CPF inválido | Validar dígitos verificadores no frontend + backend com Zod |
| Marca "Netflix" no nome | Não é trademark issue pra nome de repo/projeto interno; nome público pode ser outro ("EngCursos", "Metri Engenharia", etc.) no UI |

---

## 10. Checklist de "Pronto"

Cada feature só é considerada pronta quando:

- [ ] Typecheck passa (`pnpm typecheck`)
- [ ] Lint passa (`pnpm lint`)
- [ ] Testes unit passam (`pnpm test`)
- [ ] Testes e2e críticos passam (`pnpm test:e2e`)
- [ ] Documentada em `task.md` (ver `CLAUDE.md`)
- [ ] PR aberto contra `develop` com descrição do que foi feito
