# CLAUDE.md — Regras operacionais do projeto

> Este arquivo é carregado automaticamente pelo Claude Code a cada sessão. Ele define **como** trabalhar no repo. A **visão do produto** está em `SPEC.md`. O **roadmap de fases** está em `plan.md`. O **histórico do que foi feito** está em `task.md`.

---

## 1. Princípios

1. **Leia antes de escrever.** Abra `SPEC.md`, `plan.md` e `task.md` no início de cada sessão.
2. **Uma feature = uma branch = um PR.** Sem commits gigantes na `develop`.
3. **Nunca commite direto em `main` ou `develop`.** Sempre via PR.
4. **Ganhos pequenos e verdes.** Se o typecheck/lint/test quebrar, conserte antes de continuar.
5. **Documente tudo em `task.md`.** Append-only. Nunca apague.
6. **Se estiver em dúvida, pergunte.** Não adivinhe requisitos — consulte `SPEC.md` e, se não estiver lá, pare e pergunte ao Jorge.

---

## 2. Stack (resumo — detalhe em `SPEC.md`)

- Next.js 15 (App Router) + React 19 + TypeScript strict
- pnpm (não use npm nem yarn)
- Prisma + PostgreSQL
- Auth.js v5 (NextAuth)
- Tailwind v4 + shadcn/ui
- Tiptap (editor)
- Bunny Stream (vídeo), Cloudflare R2 (storage), Mercado Pago (Pix), Resend (email)
- Biome (lint + format, **não use ESLint/Prettier**)
- Vitest (unit) + Playwright (e2e)

---

## 3. Estrutura de pastas

```
.
├── .devcontainer/          # VS Code Dev Container
│   ├── devcontainer.json
│   ├── Dockerfile
│   └── docker-compose.yml
├── .github/
│   ├── workflows/ci.yml
│   └── pull_request_template.md
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
├── src/
│   ├── app/
│   │   ├── (public)/        # rotas públicas (catálogo, curso, aulas, prova, checkout)
│   │   │   ├── page.tsx
│   │   │   ├── cursos/[slug]/
│   │   │   └── verificar/[codigo]/
│   │   ├── admin/           # todas protegidas por middleware
│   │   │   ├── login/
│   │   │   └── (dashboard)/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── enrollment/
│   │   │   ├── progress/
│   │   │   ├── exam/
│   │   │   ├── pix/
│   │   │   │   ├── create/
│   │   │   │   ├── status/[id]/
│   │   │   │   └── webhook/
│   │   │   └── admin/
│   │   │       ├── r2/presign/
│   │   │       └── bunny/create-video/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/              # shadcn (gerados)
│   │   ├── public/          # componentes do lado público (CourseRow, Hero, Player, Sidebar…)
│   │   └── admin/           # componentes do admin (CourseForm, ModuleList, QuestionForm…)
│   ├── lib/
│   │   ├── db.ts            # Prisma client singleton
│   │   ├── auth.ts          # Auth.js config
│   │   ├── mercadopago.ts   # client + helpers
│   │   ├── bunny.ts         # client + helpers
│   │   ├── r2.ts            # S3 client configurado pro R2
│   │   ├── resend.ts        # client + helpers
│   │   ├── validations/     # schemas Zod
│   │   ├── pdf/
│   │   │   └── CertificateTemplate.tsx
│   │   └── utils.ts
│   ├── emails/              # React Email templates
│   ├── middleware.ts        # proteção /admin/*
│   └── styles/globals.css
├── tests/
│   ├── unit/
│   └── e2e/
├── SPEC.md
├── CLAUDE.md                # (este arquivo)
├── plan.md
├── task.md
├── README.md
├── .env.example
├── biome.json
├── package.json
├── tsconfig.json
└── pnpm-lock.yaml
```

---

## 4. Comandos (pnpm)

| Comando | O que faz |
|---|---|
| `pnpm dev` | Next dev server em :3000 |
| `pnpm build` | Build de produção |
| `pnpm start` | Start do build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | `biome check .` |
| `pnpm lint:fix` | `biome check . --write` |
| `pnpm test` | Vitest unit |
| `pnpm test:watch` | Vitest modo watch |
| `pnpm test:e2e` | Playwright |
| `pnpm test:e2e:ui` | Playwright com UI |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:push` | `prisma db push` (apenas protótipo, NÃO em prod) |
| `pnpm db:seed` | `tsx prisma/seed.ts` |
| `pnpm db:studio` | `prisma studio` |
| `pnpm db:reset` | `prisma migrate reset` (apaga banco local) |
| `pnpm admin:reset-password` | Script CLI pra resetar senha do admin (útil se Jorge esquecer) |
| `pnpm gates` | Roda typecheck + lint + test em sequência (aliás, rodar antes de commitar) |

---

## 5. Gates obrigatórios (rodar antes de CADA commit)

```bash
pnpm gates   # === pnpm typecheck && pnpm lint && pnpm test
```

O CI (`.github/workflows/ci.yml`) roda os mesmos gates em cada push e PR. **Um PR vermelho não entra na `develop`.**

---

## 6. Git Flow

### 6.1 Branches permanentes
- `main` — reflete o que está em produção. Protegida. Só recebe merges vindos da `develop` via PR.
- `develop` — integração. Protegida. Só recebe merges vindos de `feature/*` via PR.

### 6.2 Branches de trabalho
- `feature/<fase-ou-escopo>` — ex: `feature/bootstrap`, `feature/auth-admin`, `feature/cms-cursos`.
- `fix/<descricao-curta>` — correções pontuais.
- `docs/<descricao-curta>` — só mudanças de documentação.

### 6.3 Regra de commits

Use **Conventional Commits**:

```
feat: add Prisma schema with Course and Module
fix(pix): handle duplicate webhook idempotently
chore: configure Biome
docs: update SPEC with ADR-009
test(e2e): admin login happy path
refactor(auth): extract getAdminSession helper
```

Commits pequenos e atômicos. Cada commit deve deixar o repo em estado testável.

### 6.4 Ciclo de uma feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nome-da-feature

# ... trabalho iterativo ...
# após cada micro-progresso:
pnpm gates
git add -A
git commit -m "feat: ..."

# no fim:
git push -u origin feature/nome-da-feature
# abre PR contra develop
```

### 6.5 PR Template

O arquivo `.github/pull_request_template.md` deve conter:

```md
## O que foi feito
<!-- Resumo em 3-5 linhas do que esta PR entrega -->

## Referências
- Fase: F<N> do `plan.md`
- Issue / ADR: <se aplicável>

## Checklist
- [ ] `pnpm gates` passa localmente
- [ ] `task.md` atualizado com entrada nova
- [ ] `SPEC.md` atualizado se houve mudança de escopo
- [ ] Testes adicionados/atualizados cobrem o caminho crítico
- [ ] Sem `console.log`, `TODO` sem issue, `any` sem justificativa

## Como testar manualmente
<!-- Passos curtos -->

## Screenshots / vídeos
<!-- Se mudou UI -->
```

### 6.6 Reverter com segurança

Toda feature mergeada cria um **merge commit** em `develop` (não use squash sem motivo). Pra reverter uma feature inteira:

```bash
git revert -m 1 <sha-do-merge-commit>
```

Isso é por que existe a regra de commits pequenos e gates verdes — o histórico é o nosso "ctrl+z".

---

## 7. `task.md` — a memória do Ralph Loop

**Toda** sessão de Claude Code que fecha escopo deve adicionar uma entrada no final de `task.md`. **Append-only — nunca apague entradas antigas.**

### Formato:

```md
---
## YYYY-MM-DD HH:MM — <branch> — <título curto>

**Fase:** F<N>
**PR:** #<número> (ou "em andamento")

### O que foi feito
<!-- 3-10 bullets do que mudou concretamente -->

### Arquivos tocados
<!-- Lista dos principais -->

### Decisões
<!-- Qualquer escolha não óbvia feita durante a sessão. Se criar um ADR novo, registrar aqui E em SPEC.md. -->

### Próximos passos
<!-- O que falta dentro da fase, ou o que destrava a próxima -->

### Blockers / pendências
<!-- Coisas que precisam decisão do Jorge, infra externa (ex: credenciais Mercado Pago), etc. -->
```

### Exemplo:

```md
---
## 2026-04-23 14:32 — feature/bootstrap — Setup inicial do projeto

**Fase:** F0
**PR:** #1

### O que foi feito
- Inicializado Next.js 15 com App Router e TS strict
- Configurado Tailwind v4 + shadcn/ui (botão, input, dialog instalados)
- Prisma inicial com `AdminUser` model + migration
- Biome configurado (substitui ESLint/Prettier)
- Vitest + Playwright setup básico
- Dev container com Postgres 16 e cloudflared

### Arquivos tocados
- `package.json`, `tsconfig.json`, `next.config.ts`, `biome.json`
- `prisma/schema.prisma`, `prisma/seed.ts`
- `.devcontainer/*`
- `.github/workflows/ci.yml`

### Decisões
- pnpm como gerenciador (não npm) → mais rápido, melhor pra workspaces futuros
- Biome em vez de ESLint+Prettier → config única, execução 10x mais rápida

### Próximos passos
- F1: Auth.js com Credentials + middleware admin

### Blockers
- Nenhum
```

---

## 8. Como o Claude Code deve rodar (Ralph Loop)

No início de **toda** sessão o Claude Code deve:

1. Ler `SPEC.md` (visão), `plan.md` (fase atual) e as últimas **3 entradas** de `task.md` (contexto recente).
2. Identificar a fase em que estamos e qual é a próxima tarefa.
3. Trabalhar em uma **única branch** nomeada conforme §6.2.
4. Fazer commits pequenos com mensagens Conventional.
5. Rodar `pnpm gates` antes de cada commit.
6. Ao fechar escopo (ou parar pro Jorge revisar), **atualizar `task.md`** com entrada nova e abrir/atualizar PR contra `develop`.

Se o escopo for grande demais pra uma sessão: quebre em sub-branches (`feature/cms-cursos-crud`, `feature/cms-cursos-upload`) ou commits parciais com `wip:` — mas SEMPRE deixando o build verde.

---

## 9. Regras de código

### 9.1 TypeScript
- `strict: true`. Zero `any` sem comentário `// eslint-disable-next-line` e justificativa.
- Prefira `type` a `interface` exceto quando herança for necessária.
- Nunca use `as X` sem validar antes com Zod ou type guard.

### 9.2 React/Next
- Server Components por padrão. Só use `"use client"` quando precisar de estado, eventos, ou browser APIs.
- Data fetching em Server Components (async). Mutations via Server Actions OU Route Handlers (seja consistente — prefira Server Actions pra forms, Route Handlers pra integrações externas e webhooks).
- Sem `getServerSideProps` / `getStaticProps` (App Router não usa).
- Validação de input: sempre Zod. Nunca confie em `req.body` sem parsear.

### 9.3 Prisma
- Cliente único via `src/lib/db.ts` com singleton (evita "too many connections" em dev com HMR).
- Transações multi-step: `db.$transaction(async (tx) => { ... })`.
- `select` explícito quando não precisar de todos os campos (evita vazar hashes de senha, etc.).

### 9.4 Estilo
- Nomes em **inglês** no código (variáveis, funções, modelos Prisma).
- Strings voltadas ao usuário em **PT-BR**.
- Centralize strings de UI em `src/lib/i18n.ts` ou constantes no componente (não hardcode em JSX se for reusada).

### 9.5 Segurança
- **Nunca** logue tokens, senhas ou dados de cartão.
- **Nunca** coloque `MERCADOPAGO_ACCESS_TOKEN` em código client-side. Só `NEXT_PUBLIC_*` vai pro browser.
- Webhook do MP: sempre verifique `x-signature` antes de confiar no body.
- Rota `/api/admin/*`: protegida por `middleware.ts` + double-check no handler.
- Uploads: pre-signed URLs curtas (5–10 min), nunca exponha credenciais do R2 no client.

### 9.6 Testes
- **Unit (Vitest):** lógica pura, helpers, validações Zod, cálculo de nota da prova, dígito verificador de CPF, etc. Meta: ≥ 70% nos módulos de `src/lib/`.
- **E2E (Playwright):** os **3 caminhos críticos** têm que ter teste:
  1. Admin loga, cria curso, adiciona módulo e aula (vídeo mockado).
  2. Aluno entra, assiste aula (progresso marcado), faz prova, é aprovado.
  3. Aluno paga Pix (MP em modo sandbox), certificado é emitido, verificação pública funciona.
- Não teste por testar (100% de cobertura é inútil). Teste o que quebra.

---

## 10. Onde NÃO mexer sem permissão explícita

- Arquivos em `SPEC.md` — mudança de escopo só com aprovação do Jorge.
- Variáveis em `.env` já commitadas (no `.env.example`) — se adicionar nova, atualize o example junto.
- `main` e `develop` diretamente.

---

## 11. Perguntas que o Claude Code DEVE fazer em vez de assumir

- "O texto do botão é '<X>' ou '<Y>'?" — copywriting do usuário.
- "O email de confirmação manda antes ou depois da geração do PDF?" — ordem de operações de negócio.
- "O preço inclui taxa do MP ou é líquido?" — regra financeira.
- Qualquer coisa que envolva **dinheiro**, **dados pessoais** ou **decisão de negócio** não documentada em `SPEC.md`.

---

## 12. Credenciais iniciais (dev)

- Admin email: `jorgemetrimiranda@gmail.com`
- Admin password: `31415926` — **troque imediatamente após o primeiro login**. Há comando `pnpm admin:reset-password` se precisar.

Senhas de serviços externos (Mercado Pago, Bunny, R2, Resend) ficam em `.env` local (dev) e Vercel Environment Variables (prod). **Nunca commit.**

---

## 13. Mensagem pro futuro-eu-Claude

> Sua memória entre sessões é **só o que está escrito em arquivo**. `task.md` é seu diário. Se você não escrever nele o que fez e por quê, a próxima sessão começa cega. Prefira escrever uma entrada "redundante" do que pular.
