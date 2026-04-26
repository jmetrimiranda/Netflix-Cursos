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

**F5 — Polish.** Site institucional + plataforma de cursos com paywall (1 Pix libera curso vitalício e gera certificado pós-prova-passada). SEO básico, a11y, rate limiting, LGPD e dashboard real entregues. Próxima etapa: dependências externas (KYC AbacatePay, DNS Resend, branch protection) e deploy de staging na Vercel + Neon.

---

## Deploy em produção (Vercel + Neon)

Tempo estimado pra subir do zero: **15–25 min** (assumindo contas já criadas).

### 1. Provisione o banco (Neon — free tier)

1. Crie conta em [neon.tech](https://neon.tech) → **New Project** → região `us-east-2` (latência baixa pra Vercel) → Postgres 16.
2. Copie a **connection string** (formato `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`).
3. Pulou: o Neon já cria o schema vazio. As migrations rodam no primeiro deploy.

### 2. Provisione o app (Vercel — Hobby)

1. [vercel.com](https://vercel.com) → **Add New… → Project** → conecte o repositório `Netflix-Cursos`.
2. Framework preset: **Next.js** (autodetectado).
3. Build command: `pnpm build` · Install command: `pnpm install` (ou deixe o autodetect).
4. **Não dê deploy ainda** — antes configure as variáveis de ambiente.

### 3. Configure variáveis de ambiente na Vercel

Project Settings → Environment Variables. Marque **Production** + **Preview** para tudo:

**Obrigatórias para o app subir:**

| Var | Valor | Onde obter |
|---|---|---|
| `DATABASE_URL` | string do Neon | passo 1 |
| `NEXT_PUBLIC_APP_URL` | `https://<seu-domínio>` | URL final do projeto |
| `AUTH_SECRET` | `pnpm dlx auth secret` (gere localmente, nunca reuse o de dev) | rode no terminal |
| `AUTH_TRUST_HOST` | `true` | constante |
| `ADMIN_SEED_EMAIL` | `jorgemetrimiranda@gmail.com` | fixo |
| `ADMIN_SEED_PASSWORD` | senha forte (será o login inicial) | escolha forte |

**Pagamento (sem isso, /api/checkout/create devolve 503 amigável):**

| Var | Valor | Onde obter |
|---|---|---|
| `PAYMENT_PROVIDER` | `abacatepay` | constante |
| `ABACATEPAY_API_KEY` | `abc_prod_…` | painel AbacatePay (após KYC com CNPJ) |
| `ABACATEPAY_WEBHOOK_SECRET` | gerado ao criar webhook | painel AbacatePay |
| `ABACATEPAY_API_URL` | `https://api.abacatepay.com/v1` | constante |

**Email (sem isso, certificados são emitidos sem envio + /api/contact devolve 503 amigável):**

| Var | Valor | Onde obter |
|---|---|---|
| `RESEND_API_KEY` | `re_…` | [resend.com](https://resend.com/api-keys) |
| `RESEND_FROM` | `Ativa Engenharia <no-reply@ativaengenharia.net>` | precisa DNS validado |

**Vídeo + storage (opcionais para a primeira subida; sem eles, uploads no admin falham mas o site funciona):**

| Var | Onde obter |
|---|---|
| `BUNNY_STREAM_API_KEY` / `BUNNY_STREAM_LIBRARY_ID` / `BUNNY_CDN_HOSTNAME` | painel Bunny → Stream |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_PUBLIC_URL` | Cloudflare → R2 → API Token |

### 4. Primeiro deploy

1. Vercel → **Deploy**. O build inclui `prisma generate` (via `postinstall`).
2. Aplique as migrations no Neon: localmente, com `DATABASE_URL` apontando pra prod, rode:

   ```bash
   pnpm exec prisma migrate deploy
   pnpm exec tsx --env-file=.env.production prisma/seed.ts
   ```

   Ou conecte ao Neon SQL Editor e rode os arquivos em `prisma/migrations/*/migration.sql` em ordem.

3. Acesse `https://<seu-domínio>/admin/login` e troque a senha imediatamente (`ADMIN_SEED_PASSWORD` foi a inicial).

### 5. Configure o webhook AbacatePay

1. Painel AbacatePay → **Webhooks → Novo**.
2. URL: `https://<seu-domínio>/api/payments/webhook`.
3. Eventos: `transparent.completed` (pagamento aprovado).
4. Copie o secret e cole em `ABACATEPAY_WEBHOOK_SECRET` na Vercel; redeploy.

### 6. (Opcional) Domínio próprio

1. Vercel → Project → **Settings → Domains** → adicione `ativaengenharia.net`.
2. No registrar, aponte os DNS conforme instruções da Vercel (CNAME ou A).
3. Atualize `NEXT_PUBLIC_APP_URL` para `https://ativaengenharia.net` e redeploy.

### 7. Backup do Neon

Use o script `scripts/backup-neon.sh` (ver seção abaixo) para gerar dump compactado periodicamente. Salve em storage redundante (Drive/S3).

---

## Backup do banco

`scripts/backup-neon.sh` faz `pg_dump` da `DATABASE_URL` configurada e salva em `backups/<timestamp>.sql.gz`.

```bash
# Backup ad hoc:
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require" \
  ./scripts/backup-neon.sh

# Backup agendado (crontab — exemplo de servidor com pg_dump):
# 0 3 * * *  cd /path/to/repo && DATABASE_URL=... ./scripts/backup-neon.sh >> backups/cron.log 2>&1
```

Restaurar:

```bash
gunzip -c backups/2026-04-26T03-00-00Z.sql.gz | psql "$DATABASE_URL_TARGET"
```

> **Importante:** o Neon free tier já tem branching para snapshot; o script é um backup _externo_ (defesa em profundidade). Se o Neon ficar fora do ar, você ainda tem o `.sql.gz`.

---

## Troubleshooting

- **Login admin falha em produção** — confira `ADMIN_SEED_*` definidos e a seed rodada. Ou rode `pnpm admin:reset-password` localmente apontando `DATABASE_URL` pra prod.
- **Pagamento devolve 502/503** — falta `ABACATEPAY_API_KEY` (503) ou a chave está em modo dev (`abc_dev_…`) com webhook apontando pra prod.
- **Email não chega** — domínio Resend sem DKIM/SPF (cai no spam). Use `onboarding@resend.dev` apenas para testes (só envia pro dono da conta).
- **Webhook AbacatePay 401** — `ABACATEPAY_WEBHOOK_SECRET` divergente do painel. Recopie e redeploy.
