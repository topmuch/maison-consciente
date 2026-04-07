import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Tablette Maison Consciente",
  description: "Affichage familial intelligent",
  icons: { icon: "/logo.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#020617",
};

export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020617] select-none">
      {children}
    </div>
  );
}
