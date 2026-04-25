import path from "node:path";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 36,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    color: "#1a2f4a",
    backgroundColor: "#ffffff",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 110,
    height: 36,
    objectFit: "contain",
  },
  title: {
    fontSize: 36,
    letterSpacing: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 14,
    color: "#1E3A5F",
  },
  subtitle: {
    fontSize: 11,
    letterSpacing: 4,
    textTransform: "uppercase",
    textAlign: "center",
    color: "#3D5A80",
    marginBottom: 32,
  },
  body: {
    fontSize: 13,
    lineHeight: 1.7,
    textAlign: "center",
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  signatureBlock: {
    marginTop: 48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signatureLine: {
    borderTop: "1px solid #1E3A5F",
    width: 320,
    paddingTop: 6,
    fontSize: 10,
    textAlign: "center",
    color: "#1a2f4a",
  },
  footerRow: {
    position: "absolute",
    left: 56,
    right: 56,
    bottom: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  seals: {
    fontSize: 9,
    color: "#3D5A80",
    flexDirection: "row",
    gap: 12,
  },
  sealItem: {
    marginRight: 12,
    letterSpacing: 1,
  },
  qrBlock: {
    alignItems: "center",
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
    fontSize: 10,
    marginTop: 2,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    color: "#1E3A5F",
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
};

const LOGO_PATH = path.join(process.cwd(), "public", "images", "brand", "logo.png");

export function CertificateTemplate(props: Props) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.topRow}>
          <Image src={LOGO_PATH} style={styles.logo} />
          <Text style={{ fontSize: 9, color: "#3D5A80" }}>Código: {props.verificationCode}</Text>
        </View>

        <Text style={styles.subtitle}>Ativa Engenharia · Capacitação Técnica</Text>
        <Text style={styles.title}>CERTIFICADO</Text>

        <Text style={styles.body}>
          Certificamos que <Text style={styles.bold}>{props.studentName}</Text> (CPF{" "}
          {props.studentCpfMasked}) concluiu o curso{" "}
          <Text style={styles.bold}>{props.courseTitle}</Text> com carga horária de{" "}
          <Text style={styles.bold}>{props.workloadHours}h</Text>, em{" "}
          <Text style={styles.bold}>{props.issuedAtBR}</Text>.
        </Text>

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLine}>
            Eduardo Bissoli — Eng. Mecânico / Eng. de Segurança do Trabalho — CREA MT-038597/D
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.seals}>
            <Text style={styles.sealItem}>CREA-ES</Text>
            <Text style={styles.sealItem}>ABNT</Text>
            <Text style={styles.sealItem}>CB-ES</Text>
          </View>

          <View style={styles.qrBlock}>
            {props.qrPngBuffer && <Image src={props.qrPngBuffer} style={styles.qrImage} />}
            <Text style={styles.verifyText}>Verificar autenticidade:</Text>
            <Text style={styles.codeText}>{props.verificationUrl}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
