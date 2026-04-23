FROM mcr.microsoft.com/devcontainers/typescript-node:20

# Tools:
#  - pnpm (via corepack) for the project's package manager
#  - cloudflared for exposing :3000 to Mercado Pago webhooks in dev
RUN corepack enable \
 && corepack prepare pnpm@latest --activate

RUN curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
      -o /usr/share/keyrings/cloudflare-main.gpg \
 && echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared jammy main" \
      > /etc/apt/sources.list.d/cloudflared.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends cloudflared \
 && rm -rf /var/lib/apt/lists/*
