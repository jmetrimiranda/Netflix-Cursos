FROM mcr.microsoft.com/devcontainers/typescript-node:20

# Tools:
#  - pnpm (via corepack) for the project's package manager
#  - cloudflared for exposing :3000 to webhooks (AbacatePay/Resend) in dev
#  - Playwright system deps + Chromium (so `pnpm test:e2e` roda sem `playwright install-deps` manual)
RUN corepack enable \
 && corepack prepare pnpm@latest --activate

RUN curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
      -o /usr/share/keyrings/cloudflare-main.gpg \
 && echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared jammy main" \
      > /etc/apt/sources.list.d/cloudflared.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends cloudflared \
 && rm -rf /var/lib/apt/lists/*

# Playwright Chromium + system deps. Runs via npx para evitar dependência da instalação local
# do projeto (que ainda não existe no momento do build da imagem). Cache pra /ms-playwright.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx --yes playwright@1.50.0 install-deps chromium \
 && npx --yes playwright@1.50.0 install chromium \
 && rm -rf /var/lib/apt/lists/*
