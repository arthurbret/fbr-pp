import type { Metadata } from "next";
import { Geist_Mono, Nunito_Sans } from "next/font/google";
import "./globals.css";

// Humanist geometric sans, in the same family of shapes as Avenir.
const sans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FBR PP",
  description:
    "Recadrez votre photo, détourez votre visage et téléchargez-le sur un fond bleu.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
