import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const openSans = localFont({
  src: "./fonts/OpenSans.ttf",
  weight: "300 800",
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EmpresTI",
  description: "Controle interno de empréstimos de equipamentos",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={openSans.variable}>
      <body>{children}</body>
    </html>
  );
}
