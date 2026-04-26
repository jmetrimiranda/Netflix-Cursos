#!/usr/bin/env bash
# Backup do banco Neon (ou qualquer Postgres alcançável via DATABASE_URL).
# Uso:
#   DATABASE_URL="postgresql://..." ./scripts/backup-neon.sh
# Saída:
#   backups/<ISO timestamp>.sql.gz
#
# Idempotente: roda quantas vezes quiser; cada execução gera um arquivo novo.
# Falha rápido em qualquer erro (set -euo pipefail).

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERRO: DATABASE_URL não definida." >&2
  echo "Exemplo: DATABASE_URL='postgresql://user:pass@host/db?sslmode=require' $0" >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERRO: pg_dump não encontrado no PATH." >&2
  echo "Instale com: apt-get install -y postgresql-client" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$REPO_ROOT/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
OUTPUT="$BACKUP_DIR/$TIMESTAMP.sql.gz"

echo "→ Gerando backup em $OUTPUT"

# --no-owner / --no-privileges: dump portátil (não tenta recriar roles do Neon).
# --format=plain (default): texto SQL — mais simples de inspecionar e restaurar.
pg_dump \
  --no-owner \
  --no-privileges \
  --no-comments \
  "$DATABASE_URL" \
  | gzip -9 > "$OUTPUT"

SIZE="$(du -h "$OUTPUT" | cut -f1)"
echo "✔ Backup concluído ($SIZE) em $OUTPUT"

# Higiene: avisa se há mais de 30 backups acumulados (não apaga, só sinaliza).
COUNT="$(find "$BACKUP_DIR" -name "*.sql.gz" -type f | wc -l)"
if (( COUNT > 30 )); then
  echo "⚠ $COUNT backups acumulados em $BACKUP_DIR — considere arquivar/limpar antigos." >&2
fi
