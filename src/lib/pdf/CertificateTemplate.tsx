import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LOGO_BASE64 } from "./assets/logo";
import { PHOTO_BAND_BASE64 } from "./assets/photoBand";
import { SIGNATURE_BASE64 } from "./assets/signature";
import { WATERMARK_BASE64 } from "./assets/watermark";
import { parseScopeTopics } from "./scope";

// NOTE: assets de imagem são carregados via base64 inline (ver ./assets/logo.ts),
// NUNCA via process.cwd()/fs/path — isso quebra silenciosamente no runtime
// serverless da Vercel (public/ não entra no filesystem da lambda).

// A imagem da assinatura (SIGNATURE_BASE64 = assinatura-nova.jpg) é um bloco
// COMPLETO: rubrica + "EDUARDO BISSOLI" + títulos + "CREA MT-038597/D" +
// carimbo redondo da Ativa/Bissoli Engenharia + CNPJ 29.974.056/0001-29.
// O ÚNICO texto que renderizamos abaixo da linha é o rótulo do PAPEL
// ("RESPONSÁVEL TÉCNICO — ATIVA ENGENHARIA"), simétrico ao bloco do aluno.
// NÃO repetir nome/CREA/profissão/CNPJ como texto — já estão na imagem.
const SIGNATURE_LABEL = "RESPONSÁVEL TÉCNICO — ATIVA ENGENHARIA";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    color: "#1a2f4a",
    backgroundColor: "#ffffff",
  },
  // Marca d'água: cobre a página inteira e centraliza a imagem. Renderizada
  // como PRIMEIRO filho do <Page> com a prop `fixed` → fica ATRÁS do conteúdo
  // (ordem de documento) E é excluída do cálculo de paginação. Sem `fixed`,
  // este wrapper absolute (top:0/bottom:0 = altura cheia da página) excede a
  // área útil e força uma página em branco extra. A arte-fonte (logo 1.png) era
  // translúcida demais (alpha médio ~2%); o base64 em watermark.ts foi
  // regerado multiplicando o canal alfa por 2.5 → alpha médio ~5% (max ~24%),
  // ficando discreto mas perceptível. NÃO aplicamos `opacity` no <Image> porque
  // opacity < 1 MULTIPLICA (reduziria), e o efeito desejado é AUMENTAR.
  watermarkWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  watermarkImg: {
    width: 330,
    height: 344,
    objectFit: "contain",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  // Logo ampliado vs. o tamanho-base original (~36pt; o alvo "6x" seria ~216pt).
  // Testado com renderToBuffer: a partir de ~165pt, combinado com a assinatura
  // nova (maior) e nomes longos que quebram o corpo em 3 linhas, a página 1
  // transborda pra uma 3ª página. 160pt (~4.4x) é o maior valor que mantém
  // EXATAMENTE 2 páginas com folga em todos os casos realistas testados.
  logo: {
    width: 160,
    height: 160,
    objectFit: "contain",
  },
  headerRight: {
    alignItems: "flex-end",
    maxWidth: 300,
  },
  headerCode: {
    fontSize: 9,
    color: "#3D5A80",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    letterSpacing: 4,
    textTransform: "uppercase",
    textAlign: "center",
    color: "#3D5A80",
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    letterSpacing: 6,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 18,
    color: "#6b7280",
  },
  body: {
    fontSize: 13,
    lineHeight: 1.7,
    textAlign: "left",
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  boldUnderline: {
    fontFamily: "Helvetica-Bold",
    textDecoration: "underline",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    color: "#1E3A5F",
  },
  signatureRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
  },
  signatureCol: {
    width: 280,
    alignItems: "center",
  },
  // assinatura-nova.jpg é um bloco completo (rubrica + nome + CREA + carimbo +
  // CNPJ). Ratio ~1.415 (w/h): 134 de largura → ~95 de altura. Tamanho
  // calibrado (renderToBuffer) pra caber na página 1 com o logo grande, o
  // nome longo E o rótulo/linha do responsável técnico abaixo da imagem,
  // mantendo EXATAMENTE 2 páginas.
  signatureImage: {
    width: 134,
    height: 95,
    objectFit: "contain",
    marginBottom: 2,
  },
  signatureLine: {
    borderTop: "1px solid #1E3A5F",
    width: 280,
    paddingTop: 6,
    fontSize: 9,
    textAlign: "center",
    color: "#1a2f4a",
  },
  qrImage: {
    width: 72,
    height: 72,
  },
  verifyText: {
    fontSize: 8,
    marginTop: 4,
    color: "#3D5A80",
  },
  codeText: {
    fontSize: 9,
    marginTop: 2,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    color: "#1E3A5F",
  },
  // Página 2 — escopo acadêmico
  photoBand: {
    width: "100%",
    objectFit: "contain",
    marginBottom: 22,
  },
  scopeBox: {
    border: "1px solid #1E3A5F",
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  scopeTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    color: "#1E3A5F",
    textAlign: "center",
  },
  scopeSubtitle: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#3D5A80",
    marginTop: 4,
    textAlign: "center",
  },
  scopeHeading: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    color: "#1E3A5F",
    marginBottom: 10,
  },
  topicRow: {
    flexDirection: "row",
    marginBottom: 6,
    paddingRight: 16,
  },
  topicBullet: {
    fontSize: 11,
    marginRight: 6,
    color: "#1E3A5F",
  },
  topicText: {
    fontSize: 11,
    lineHeight: 1.5,
    flex: 1,
  },
  scopeSignature: {
    position: "absolute",
    right: 56,
    bottom: 50,
    width: 280,
    alignItems: "center",
  },
  scopeSignatureLabel: {
    borderTop: "1px solid #1E3A5F",
    width: 280,
    paddingTop: 6,
    fontSize: 9,
    textAlign: "center",
    color: "#1a2f4a",
  },
});

type Props = {
  studentName: string;
  studentCpfMasked: string;
  courseTitle: string;
  workloadHours: number;
  issuedAtBR: string;
  verificationCode: string;
  verificationUrl: string;
  qrPngBuffer: Buffer;
  // Configuração por curso (nullable — cursos antigos caem nos fallbacks).
  certificateCourseName: string | null;
  certificateValidity: string | null;
  examScopeTitle: string | null;
  examScopeSubtitle: string | null;
  examScopeTopics: string | null;
};

function clean(value: string | null | undefined): string {
  return (value ?? "").trim();
}

export function CertificateTemplate(props: Props) {
  // Fallbacks (degradação graciosa para cursos não configurados):
  // - courseName: nome configurado OU título do curso.
  // - validity: só renderiza a linha se configurada.
  // - scopeTitle: título configurado OU courseName (nunca vazio).
  // - scopeSubtitle: só renderiza se configurado.
  // - topics: lista vazia → página 2 sem bullets (não quebra).
  const courseName = clean(props.certificateCourseName) || props.courseTitle;
  const validity = clean(props.certificateValidity);
  const scopeTitle = clean(props.examScopeTitle) || courseName;
  const scopeSubtitle = clean(props.examScopeSubtitle);
  const topics = parseScopeTopics(props.examScopeTopics);

  return (
    <Document>
      {/* PÁGINA 1 — certificado */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View fixed style={styles.watermarkWrap}>
          <Image src={WATERMARK_BASE64} style={styles.watermarkImg} />
        </View>

        <View style={styles.topRow}>
          <Image src={LOGO_BASE64} style={styles.logo} />
          {/* QR de verificação no topo-direito — área própria, longe do bloco
              de assinatura do aluno (rodapé) para não sobrepor. */}
          <View style={styles.headerRight}>
            <Text style={styles.headerCode}>Código: {props.verificationCode}</Text>
            {props.qrPngBuffer && <Image src={props.qrPngBuffer} style={styles.qrImage} />}
            <Text style={styles.verifyText}>Verificar autenticidade:</Text>
            <Text style={styles.codeText}>{props.verificationUrl}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>Ativa Engenharia · Capacitação Técnica</Text>
        <Text style={styles.title}>CERTIFICADO {courseName}</Text>

        <Text style={styles.body}>
          Certificamos que <Text style={styles.boldUnderline}>{props.studentName}</Text>, portador
          do CPF <Text style={styles.boldUnderline}>{props.studentCpfMasked}</Text>, realizou o
          curso de <Text style={styles.boldUnderline}>{courseName}</Text> no dia{" "}
          <Text style={styles.boldUnderline}>{props.issuedAtBR}</Text>.
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>CARGA HORÁRIA: {props.workloadHours}h</Text>
          {validity ? <Text style={styles.metaText}>VALIDADE: {validity}</Text> : null}
        </View>

        <View style={styles.signatureRow}>
          <View style={styles.signatureCol}>
            <Image src={SIGNATURE_BASE64} style={styles.signatureImage} />
            <Text style={styles.signatureLine}>{SIGNATURE_LABEL}</Text>
          </View>
          <Text style={styles.signatureLine}>{props.studentName}</Text>
        </View>
      </Page>

      {/* PÁGINA 2 — escopo acadêmico */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View fixed style={styles.watermarkWrap}>
          <Image src={WATERMARK_BASE64} style={styles.watermarkImg} />
        </View>

        {/* Banda de fotos — cabeçalho full-width no topo, conteúdo vem abaixo */}
        <Image src={PHOTO_BAND_BASE64} style={styles.photoBand} />

        <View style={styles.scopeBox}>
          <Text style={styles.scopeTitle}>{scopeTitle}</Text>
          {scopeSubtitle ? <Text style={styles.scopeSubtitle}>{scopeSubtitle}</Text> : null}
        </View>

        <Text style={styles.scopeHeading}>ESCOPO ACADÊMICO:</Text>
        <View>
          {topics.map((topic, i) => (
            <View key={`${i}-${topic}`} style={styles.topicRow}>
              <Text style={styles.topicBullet}>•</Text>
              <Text style={styles.topicText}>{topic}</Text>
            </View>
          ))}
        </View>

        <View style={styles.scopeSignature}>
          <Image src={SIGNATURE_BASE64} style={styles.signatureImage} />
          <Text style={styles.scopeSignatureLabel}>{SIGNATURE_LABEL}</Text>
        </View>
      </Page>
    </Document>
  );
}
