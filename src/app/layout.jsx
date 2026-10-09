import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import styles from "./layout.module.css";
import { BarraNavegacion } from "@/dominio/autenticacion/BarraNavegacion";
import { PiePagina } from "@/componentes/PiePagina";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CFA — Contrataciones de Fútbol Argentino",
  description: "Plataforma que conecta candidatos, representantes y clubes de fútbol argentino.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} ${styles.html}`}
    >
      <body className={styles.body}>
        <BarraNavegacion />
        <div className={styles.contenido}>{children}</div>
        <PiePagina />
      </body>
    </html>
  );
}
