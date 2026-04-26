import { SITE_NAME, defaultOgImages, getSiteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} — Soluções integradas em engenharia`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Soluções integradas em engenharia: climatização, elétrica, mecânica, civil e segurança do trabalho. Cursos online com certificado.",
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  keywords: [
    "engenharia",
    "climatização",
    "PMOC",
    "NR-12",
    "NR-13",
    "SPDA",
    "segurança do trabalho",
    "cursos online",
    "certificado",
    "Espírito Santo",
    "CREA",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "pt_BR",
    url: getSiteUrl(),
    images: defaultOgImages(),
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
