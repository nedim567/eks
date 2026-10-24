import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maturalna Ekskurzija IV-4 2026",
  description: "A considered collection of photographs and little moving moments.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
