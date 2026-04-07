import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maison Consciente — L'Habitation Intelligente",
  description: "Transformez votre demeure en espace intelligent et sensoriel. QR codes, suivi de présence, suggestions contextuelles.",
  keywords: ["maison consciente", "smart home premium", "domotique luxe", "habitation intelligente"],
  authors: [{ name: "Maison Consciente" }],
  icons: { icon: "/logo.svg" },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0a0a12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
