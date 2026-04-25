# SPEC — Ativa Engenharia

> Site institucional + plataforma de cursos online da **Ativa Engenharia** (engenharia mecânica, elétrica, civil, climatização, segurança do trabalho). Site institucional apresenta a empresa e seus serviços; plataforma de cursos com catálogo público estilo Netflix, player com material lateral, prova, e emissão de certificado pago via Pix. Admin único para gestão de cursos.

---

## 1. Visão & Personas

### 1.1 Visão

Uma plataforma única, leve e moderna, que combina:

- **Site institucional (público, sem conta):** apresenta a empresa Ativa Engenharia, seus serviços de engenharia (climatização, elétrica, mecânica, civil, segurança do trabalho), responsáveis técnicos, certificações, e canais de contato. É o cartão de visitas digital que substitui o portfólio em PDF.
- **Plataforma de cursos (público, sem conta):** catálogo estilo Netflix, player com material lateral, prova e certificado. Aluno só fornece email quando inicia um curso e nome/CPF quando vai comprar o certificado.
- **Admin (um único usuário):** cria/edita cursos, módulos, aulas (com upload de vídeo), material lateral (Tiptap), PDFs, banco de questões.

A integração num só domínio mantém custos mínimos e simplifica operação. O foco principal do site é **vender cursos**, com os serviços de engenharia presentes mas em segundo plano.

### 1.2 Personas

| Persona | O que faz |
|---|---|
| **Aluno (público)** | Entra no catálogo, navega, assiste, faz prova. Paga Pix se quiser certificado. |
| **Cliente potencial (público)** | Conhece a empresa via Home, vê serviços, solicita orçamento via Contato/WhatsApp. |
| **Admin (Jorge)** | Cria e gerencia cursos. Único admin do sistema. |

### 1.3 Identidade

- **Nome legal:** Ativa Engenharia
- **Localização:** Espírito Santo (CREA-ES, Corpo de Bombeiros ES)
- **Slogan:** "Segurança e Qualidade"
- **Contatos públicos:**
  - WhatsApp: 27 99818-3686
  - Instagram: @ativaeng
  - Email: ativaengmec@gmail.com
  - Site: www.ativaengenharia.net
- **Responsáveis técnicos:**
  - Eduardo Bissoli — Eng. Mecânico / Eng. de Segurança do Trabalho — CREA MT-038597/D
  - Danilo Marquesini — Eng. Eletricista — CREA BA-300003660-7/D
  - Renan Venturin Destefani — Eng. Civil — CREA ES-034006/D
- **Selos institucionais:** CREA-ES, ABNT, Corpo de Bombeiros ES

### 1.4 Escopo de escala

- Até ~1000 alunos/ano
- ~20–100 sessões simultâneas no pico
- ~50–200 visitas/mês na parte institucional (estimativa conservadora)
- Assumir volumes baixos → priorizar simplicidade operacional sobre otimização prematura

### 1.5 Identidade visual

- **Paleta primária:** azul-marinho `#1E3A5F` (extraído da logo)
- **Paleta secundária:** azul médio `#3D5A80`
- **Tema híbrido:**
  - **Light mode** nas páginas institucionais (`/`, `/servicos`, `/quem-somos`, `/faq`, `/contato`)
  - **Dark mode** no app de cursos (`/cursos`, `/cursos/[slug]`, `/cursos/[slug]/aulas/[id]`) e admin (`/admin/*`)
- **Tipografia:** Inter (sans-serif geométrica, via `next/font/google`) em todas as páginas
- **Logo:** `public/images/brand/logo.png` (símbolo + wordmark "Ativa Engenharia")

---

## 2. Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript | SOTA pra app + SSR do catálogo + API routes pra webhooks |
| Package manager | pnpm | Rápido, workspace-ready |
| Estilo | Tailwind CSS v4 + shadcn/ui | Componentes acessíveis + customização total |
| Fonte | Inter via `next/font/google` | Sans-serif geométrica moderna, otimizada pro Next |
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
| Carrossel | `embla-carousel-react` | Leve, headless, autoplay plugin oficial |
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
- `examPassScore` (Float, nota mínima — **default 6.0**, editável por curso)
- `published` (Boolean, default false)
- `featured` (Boolean, default false — destaca na home institucional)
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

**`Enrollment`** — criado no checkout (não mais "no 1º acesso")
- `id`, `studentEmail`, `courseId` (FK), `startedAt`
- `status` (`pending_payment` | `active` | `cancelled`, default `pending_payment`) — fonte da verdade pra acesso ao curso (ADR-012)
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

### 3.3 Conteúdo institucional (estático, não vive no banco)

Os textos de páginas institucionais (`/`, `/servicos`, `/quem-somos`, `/faq`, `/contato`) ficam em arquivos TypeScript versionados sob `src/content/` (ex: `src/content/services.ts`, `src/content/faq.ts`). Trocar conteúdo institucional = commit no git, não mudança no banco. Razão: o admin não edita esse conteúdo no dia a dia, e versionamento ajuda a auditar mudanças de copy.

---

## 4. Fluxos Críticos

### 4.1 Fluxo do visitante institucional

1. Acessa `/` → vê hero institucional com carrossel autoplay 5s, 2 CTAs ("Ver cursos" e "Solicitar orçamento"), cards "Por que Ativa Engenharia", preview de cursos em destaque, preview de serviços, selos.
2. Pode navegar para:
   - `/servicos` → lista completa dos serviços agrupados por categoria
   - `/quem-somos` → história, missão, responsáveis técnicos
   - `/faq` → perguntas frequentes
   - `/contato` → form + WhatsApp
3. CTAs principais convergem para `/cursos` (foco em cursos) ou `/contato` (foco em serviços).

### 4.2 Fluxo do aluno (cursos)

1. Chega em `/cursos` → vê catálogo dark com filtro de categoria.
2. Clica num curso → `/cursos/[slug]`. Vê descrição, módulos read-only, **preço destacado**, e CTA dinâmico:
   - Sem enrollment OU sem email salvo: **"Comprar acesso"**.
   - Com enrollment `pending_payment`: **"Finalizar pagamento"**.
   - Com enrollment `active`: **"Continuar curso"** → primeira aula não-concluída.
3. **Comprar acesso** → `/cursos/[slug]/comprar` → form único: email, nome completo, CPF (com validação dígitos verificadores), checkbox LGPD.
4. Submit → `POST /api/checkout/create`:
   - Cria `Enrollment` (status `pending_payment`) + `Payment` (status `pending`).
   - Chama `gateway.createPix(...)` (AbacatePay por default, ADR-013).
   - Retorna QR + brCode + expiresAt.
5. `/cursos/[slug]/comprar/pix` mostra QR code, botão copiar brCode, contador 30min.
6. Polling 3s em `/api/checkout/status/[id]`. Webhook do gateway é canal primário; polling apenas lê do banco.
7. Quando `Payment.status='approved'`:
   - Webhook flipa `enrollment.status='active'`.
   - Frontend detecta via polling, redireciona pra primeira aula.
8. Aluno assiste todas as aulas (mesmo player + sidebar Tiptap da F3, mesmo tracking de progresso).
9. **Botão "Fazer prova"** só destrava com `enrollment.status='active'` E todas `Lesson` completed.
10. Prova: sorteio de N questões, correção server-side, score = (corretas/total)*10.
11. Se `score >= course.examPassScore` (default 6.0): **certificado emitido automaticamente** via `issueCertificateIfNeeded()` (idempotente). Sem 2º pagamento.
12. Email enviado via Resend com link pro PDF + link pra verificação pública.

### 4.3 Fluxo do admin

1. `/admin/login` → credenciais.
2. `/admin` → dashboard com cards: total de cursos, alunos (distinct `studentEmail` em `Enrollment`), certificados emitidos, receita acumulada (sum `Payment.amountCents` onde `status=approved`).
3. `/admin/cursos` → lista com CRUD. Criar/editar:
   - Dados do curso (título, descrição, preço em BRL, carga horária, categoria, featured).
   - Upload de thumbnail → presigned R2.
   - Publicar (toggle `published`).
4. `/admin/cursos/[id]` → edita módulos e aulas:
   - CRUD de `Module` (drag-to-reorder).
   - CRUD de `Lesson` (upload TUS pro Bunny, Tiptap pro `sidebarContent`, PDF opcional).
5. `/admin/cursos/[id]/questoes` → CRUD de banco de questões.
6. `/admin/alunos` → lista distinct emails com cursos iniciados, provas feitas, certificados pagos.

### 4.4 Emissão do certificado (pós-Pix aprovado)

1. Trigger: `Payment.status` vira `approved` (via polling ou webhook — ambos idempotentes).
2. Gera `verificationCode` (`EC-` + 8 chars aleatórios base32).
3. Renderiza PDF com `@react-pdf/renderer`:
   - Template único (`src/lib/pdf/CertificateTemplate.tsx`).
   - Logo Ativa Engenharia no topo.
   - Selos CREA-ES, ABNT, Bombeiros ES no rodapé.
   - Dados dinâmicos: `studentName`, `studentCpf`, `courseTitle`, `workloadHours`, `issuedAt` formatada em PT-BR, `verificationCode`, QR code apontando pra `https://<domínio>/verificar/<code>`.
4. Upload do buffer pro R2 em `certificates/<verificationCode>.pdf` → salva `pdfUrl`.
5. Cria `Certificate` no banco.
6. Envia email via Resend (template em `src/emails/CertificateIssued.tsx`).
7. Frontend detecta status via polling → redireciona pra tela do certificado.

### 4.5 Verificação pública

- `/verificar/[codigo]` (SSR):
  - Busca `Certificate` por `verificationCode`.
  - Se encontra: mostra página com dados (nome, curso, carga horária, data, ✓ válido) + selos institucionais.
  - Se não: "Código inválido."

### 4.6 Fluxo de contato (orçamento)

1. Visitante chega em `/contato` (via menu ou CTA "Solicitar orçamento" na home/serviços).
2. Vê:
   - Form simples: nome, email, telefone, mensagem.
   - Botão grande verde: "Falar agora pelo WhatsApp" → abre `https://wa.me/5527998183686?text=...` (mensagem pré-preenchida).
   - Card de contatos diretos (email, Instagram).
3. Submit do form abre o cliente de email do usuário (`mailto:`) com os dados pré-preenchidos. **Sem backend nesta versão.** Backend SMTP (Resend) entra em F5 ou conforme demanda.

---

## 5. Regras de Negócio (resumo)

- Nota mínima aprovação: **default `6.0`**, campo `examPassScore` por curso (admin pode ajustar).
- **Aluno só acessa conteúdo se `Enrollment.status='active'`** — webhook do Pix é quem flipa de `pending_payment` → `active`.
- Certificado é emitido **automaticamente** quando `ExamAttempt.passed=true` E `Enrollment.status='active'` (1 Pix libera tudo).
- Certificado é **vitalício**.
- Acesso ao curso é **vitalício** (`Enrollment.status='active'` não expira; só vira `cancelled` em caso de reembolso manual).
- Tentativas de prova: ilimitadas, sem cooldown.
---

## 6. ADRs (Architectural Decision Records)

### ADR-001: Vídeo no Bunny Stream em vez de self-host ou Mux
**Contexto:** preciso host de vídeo barato pra ~1000 usuários/ano, com player embed e CDN.
**Decisão:** Bunny Stream.
**Justificativa:** Mux começa em ~$20/mês; Cloudflare Stream cobra $5/1k min armazenados; Bunny custa ~$0.005/GB armazenado + $0.01/GB entregue → estimado $2–5/mês pro projeto. Player incluso, API simples, TUS pra upload resumível.
**Consequências:** Lock-in leve no Bunny.

### ADR-002: R2 em vez de S3/Supabase Storage
**Contexto:** storage pra PDFs, thumbs, certificados, imagens institucionais.
**Decisão:** Cloudflare R2.
**Justificativa:** Egress zero, S3-compatível, mais barato que S3 e Supabase Storage na faixa de uso.
**Consequências:** Precisa conta Cloudflare.

### ADR-003: Mercado Pago para Pix
**Contexto:** receber Pix no Brasil, MEI.
**Decisão:** Mercado Pago (SDK oficial Node).
**Justificativa:** MEI ✓, sem mensalidade, docs em PT-BR, maior ecossistema de exemplos no Brasil.
**Consequências:** Taxa por transação (~0.99%). Webhook precisa verificação HMAC.

### ADR-004: Polling como canal primário de status Pix, webhook como redundância
**Contexto:** Status do pagamento tem que chegar ao frontend.
**Decisão:** Polling 3s em `/api/pix/status/[id]`. Webhook como reforço, idempotente.
**Justificativa:** Na escala (20–100 simultâneos), polling de 3s é trivial. Remove complexidade de túnel em dev.
**Consequências:** Ambos caminhos atualizam o mesmo registro `Payment` — operações devem ser idempotentes.

### ADR-005: Certificado pré-renderizado em vez de on-demand
**Contexto:** Certificado é imutável.
**Decisão:** Gerar 1x após Pix aprovado, salvar no R2, reusar a URL.
**Justificativa:** Imutabilidade garantida, latência zero no download, custo de CPU baixo.
**Consequências:** Storage cresce linearmente com certificados emitidos (trivial).

### ADR-006: Upload de vídeo direto pro Bunny (TUS), não pelo Vercel
**Contexto:** Vercel serverless tem limite de 4.5 MB em payloads.
**Decisão:** Cliente faz TUS upload direto pro Bunny.
**Justificativa:** Padrão SOTA (Mux, Bunny, YouTube fazem igual). Evita timeout.
**Consequências:** Admin precisa conectividade decente.

### ADR-007: Auth.js (NextAuth v5) com Credentials provider, apenas 1 admin
**Contexto:** Só 1 admin, sem registro público.
**Decisão:** Auth.js v5 + Credentials. Seed cria o admin único.
**Justificativa:** Padrão do ecossistema Next. Trivial pra 1 user.
**Consequências:** Se quiser múltiplos admins, só remover constraint de seed.

### ADR-008: Prisma em vez de Drizzle
**Contexto:** ORM TypeScript.
**Decisão:** Prisma.
**Justificativa:** Melhor DX (schema declarativo, migrações automáticas, Studio).
**Consequências:** Build size um pouco maior (irrelevante).

### ADR-009: Site institucional + plataforma de cursos no mesmo Next.js, não separados
**Contexto:** Ativa Engenharia tem identidade dupla (empresa de serviços + escola de cursos). Tecnicamente seria possível separar em dois domínios/repos.
**Decisão:** Tudo num só Next.js, sob mesmo domínio (ativaengenharia.net).
**Justificativa:** Custo zero adicional, simplicidade operacional, SEO compartilhado, UX coesa pro usuário que pode ser cliente E aluno. Foco principal é cursos (CTA hero), serviços ficam complementares.
**Consequências:** Aplicação fica maior. Tema híbrido (light institucional + dark app) requer lógica de detecção de rota no layout.

### ADR-010: Tema híbrido (light institucional + dark app) em vez de monotema
**Contexto:** A logo Ativa é projetada pra fundo claro (azul-marinho sobre cinza claro). O catálogo de cursos foi desenhado dark mode na F3 (estilo Netflix).
**Decisão:** Páginas institucionais em light mode (`/`, `/servicos`, `/quem-somos`, `/faq`, `/contato`). App de cursos e admin em dark mode (`/cursos/*`, `/admin/*`).
**Justificativa:** Casa com a identidade visual da marca em ambas as personas (cliente quer profissionalismo claro, aluno quer imersão escura como em streaming). Permite reaproveitar quase 100% da F3 sem rework.
**Consequências:** O `<PublicHeader/>` precisa detectar a rota e adaptar tema (logo + cores). Gera +1 versão da logo (clara pra fundo escuro). Documentação interna mais cuidadosa pra não misturar tokens.

### ADR-011: Conteúdo institucional em arquivos TS, não no banco
**Contexto:** Textos de "Quem Somos", lista de serviços, FAQ, contatos não mudam toda hora e são curtos.
**Decisão:** Arquivos sob `src/content/` (ex: `services.ts`, `faq.ts`, `team.ts`, `contact.ts`).
**Justificativa:** Versionamento via git, sem backend, sem CMS extra, type-safe (TS infere). Admin não edita esse conteúdo no painel.
**Consequências:** Mudar conteúdo = commit + deploy. Pra esse volume de mudanças (raras), é o trade-off certo. Se virar volume alto, F6+ pode introduzir admin de "Páginas Institucionais".
### ADR-012: Paywall total — 1 Pix libera curso + certificado
**Contexto:** F3 implementou modelo "preview grátis, paga só pelo certificado". Validei com cliente: o produto correto é paywall total, com pagamento antes do acesso ao conteúdo.
**Decisão:** Aluno informa email + nome + CPF e paga via Pix antes de acessar qualquer aula. Pagamento aprovado dá acesso vitalício ao curso. Certificado é emitido automaticamente quando o aluno passa na prova (`score >= examPassScore`, default 6.0), sem 2º pagamento.
**Justificativa:** Modelo mais simples pro aluno (1 transação) e pro admin (1 produto, 1 preço). Reduz superfície de checkout e fricção pós-aprovação. Alinha com expectativa típica de cursos online no Brasil (Hotmart, Eduzz, etc).
**Consequências:** `/cursos/[slug]` para não-comprador vira página de venda. `Enrollment` ganha campo `status` (`pending_payment` | `active` | `cancelled`) — fonte da verdade pra acesso. Endpoints de aula/progresso/exame ganham guard `hasAccess(enrollment)`. F3 não foi rolled-back; gates entraram em F4 sobre o que F3 já tinha. Modal de email da F3 ficou obsoleto (captura agora é exclusiva do checkout).

### ADR-013: Gateway de pagamento atrás de adapter pattern, AbacatePay como default
**Contexto:** Jorge pediu que o gateway seja "fácil de trocar depois". Cliente começa com uma conta receptora (CNPJ Ativa Engenharia) e pode querer trocar de provedor sem rewrite. Avaliei AbacatePay vs Mercado Pago.
**Decisão:** Interface `PaymentGateway` em `src/lib/payments/types.ts` com 3 métodos: `createPix`, `getStatus`, `verifyWebhook`. Implementação default: `AbacatePayGateway` em `src/lib/payments/abacatepay.ts`. Factory `getPaymentGateway()` lê `process.env.PAYMENT_PROVIDER` (default `'abacatepay'`). Trocar gateway = escrever novo adapter + flip env var, sem refactor em rotas.
**Justificativa AbacatePay sobre MP:** taxa fixa R$ 0,80/transação (vs ~0,99% MP) é melhor pra ticket alto; DX consistentemente reportada como superior; sandbox automático sem KYC; CNPJ ativo da Ativa Engenharia (29.974.056/0001-29) é LTDA estabelecida desde 2018 — passa KYC sem fricção. Risco de troca futura mitigado pela camada de adapter.
**Consequências:** Toda rota de checkout/webhook chama `getPaymentGateway()`, nunca SDK direto. Schema mantém campo `mpPaymentId` (legado da época MP) por economia de churn — comentário no schema documenta que serve a qualquer gateway. Mudança de provedor exige novo adapter (~100 linhas) + variáveis de ambiente novas. Webhook do AbacatePay valida HMAC SHA-256 com `ABACATEPAY_WEBHOOK_SECRET`.
---

## 7. Variáveis de Ambiente

Documentar em `.env.example` no repo (sem valores reais).

```env
# --- Next / App ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# --- Database (Neon em prod, docker-compose em dev) ---
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ativa_engenharia

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
R2_BUCKET=ativa-engenharia
R2_PUBLIC_URL=                       # ex: https://pub-xxxx.r2.dev ou domínio custom

# --- Resend ---
RESEND_API_KEY=
RESEND_FROM=Ativa Engenharia <no-reply@ativaengenharia.net>


# --- Payment Gateway (ADR-013) ---
PAYMENT_PROVIDER=abacatepay
ABACATEPAY_API_KEY=               # dev mode token, pega em app.abacatepay.com
ABACATEPAY_WEBHOOK_SECRET=        # gera ao criar webhook no painel
ABACATEPAY_API_URL=https://api.abacatepay.com/v1
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
- Backend de form de contato (mailto: nesta versão; SMTP fica pra F5+)
- CMS de páginas institucionais (TS + git nesta versão)
- Sistema de orçamento online (botão WhatsApp resolve)

---

## 9. Riscos conhecidos

| Risco | Mitigação |
|---|---|
| Admin esquece senha | Seed idempotente + endpoint CLI `pnpm admin:reset-password` (documentado no README) |
| Webhook MP chega duplicado | Toda atualização é `UPDATE WHERE status != 'approved'` (idempotente) |
| Aluno perde acesso ao certificado | `verificationCode` é permanente; `/verificar/[codigo]` público; email fica no inbox |
| Upload de vídeo trava meio do caminho | TUS é resumível |
| Preço muda depois da venda | `Payment.amountCents` guarda o valor no momento da compra (snapshot) |
| CPF inválido | Validar dígitos verificadores no frontend + backend com Zod |
| Form de contato sem backend pode parecer quebrado | Botão WhatsApp grande e proeminente; form cai no `mailto:` que é fluxo padrão |
| Carrossel autoplay quebra a11y | Pausar no hover/foco, controles de seta acessíveis, respeitar `prefers-reduced-motion` |
| Tema híbrido confunde o usuário | Header se adapta consistentemente à rota; paleta primary é a mesma em ambos os temas |
| Logo no fundo escuro fica estranha | Versão clara da logo (`logo-light.png` com filter ou arquivo separado) usada em rotas dark |

---

## 10. Checklist de "Pronto"

Cada feature só é considerada pronta quando:

- [ ] Typecheck passa (`pnpm typecheck`)
- [ ] Lint passa (`pnpm lint`)
- [ ] Testes unit passam (`pnpm test`)
- [ ] Testes e2e críticos passam (`pnpm test:e2e`)
- [ ] Documentada em `task.md` (ver `CLAUDE.md`)
- [ ] PR aberto contra `develop` com descrição do que foi feito