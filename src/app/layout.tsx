import type { Metadata, Viewport } from "next";
import { Gabarito, Onest } from "next/font/google";
import { StoreHydration } from "@/components/StoreHydration";
import "./globals.css";

const gabarito = Gabarito({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-gabarito",
  display: "swap",
});

const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-onest",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoalSnap — Foto soalnya, jadi latihannya",
  description:
    "Unggah foto, PDF, atau dokumen soal — AI memecahnya menjadi latihan interaktif yang siap dimainkan siswa lewat satu tautan.",
};

export const viewport: Viewport = {
  themeColor: "#0E8A7B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${gabarito.variable} ${onest.variable}`}>
      <body>
        <StoreHydration />
        {children}
      </body>
    </html>
  );
}
