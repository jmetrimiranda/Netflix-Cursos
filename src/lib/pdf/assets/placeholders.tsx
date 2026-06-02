import { StyleSheet, Text, View } from "@react-pdf/renderer";

/**
 * Placeholders TEMPORÁRIOS do certificado (Etapa 1).
 *
 * Estes elementos existem só até os assets reais chegarem (Etapa 2):
 * - Banda de fotos (topo da página 2): hoje é uma faixa cinza com rótulo.
 *   Será substituída por um PNG real carregado como base64 (mesmo padrão
 *   do logo em `./logo.ts`), NUNCA via filesystem/process.cwd().
 * - Marca d'água: NÃO renderizada nesta etapa — ver TODO no
 *   CertificateTemplate. Depende do PNG translúcido real e de validação
 *   visual da sobreposição no @react-pdf/renderer.
 *
 * Quando os assets reais entrarem, este arquivo pode ser removido (ou os
 * componentes trocados por <Image src={...BASE64} />).
 */

const styles = StyleSheet.create({
  photoBand: {
    width: "100%",
    height: 96,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    border: "1px dashed #9ca3af",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  photoBandLabel: {
    fontSize: 10,
    letterSpacing: 1,
    color: "#6b7280",
    textTransform: "uppercase",
  },
});

/** Faixa cinza no topo da página 2. Placeholder até o PNG real (Etapa 2). */
export function PhotoBandPlaceholder() {
  return (
    <View style={styles.photoBand}>
      <Text style={styles.photoBandLabel}>[banda de fotos — placeholder]</Text>
    </View>
  );
}
