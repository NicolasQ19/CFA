import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import styles from "./layout.module.css";
import { BarraNavegacion } from "@/dominio/autenticacion/BarraNavegacion";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CFA — Contrataciones de Fútbol Argentino",
  description: "Plataforma que conecta candidatos, representantes y clubes de fútbol argentino.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} ${styles.html}`}
    >
      <body className={styles.body}>
        <BarraNavegacion />
        {children}
      </body>
    </html>
  );
}
