/**
 * Converte o texto livre de `Course.examScopeTopics` (um tópico por linha)
 * numa lista de tópicos limpos, pronta para renderizar como bullets no PDF.
 *
 * - Aceita `\n` e `\r\n`.
 * - Faz trim de cada linha e descarta linhas vazias.
 * - `null` / `undefined` / texto só com espaços → `[]` (página de escopo
 *   renderiza vazia, sem quebrar).
 */
export function parseScopeTopics(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
