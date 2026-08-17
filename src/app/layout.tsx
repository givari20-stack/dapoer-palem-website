import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const headingFont = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const fallbackMetadata: Metadata = {
  title: {
    default: "Dapoer Palem | Inspired by Nature",
    template: "%s | Dapoer Palem",
  },
  description: "Official website of Dapoer Palem — Inspired by Nature.",
  applicationName: "Dapoer Palem",
  keywords: ["Dapoer Palem", "Inspired by Nature"],
  openGraph: {
    type: "website",
    siteName: "Dapoer Palem",
    title: "Dapoer Palem | Inspired by Nature",
    description: "Official website of Dapoer Palem — Inspired by Nature.",
  },
  twitter: {
    card: "summary",
    title: "Dapoer Palem | Inspired by Nature",
    description: "Official website of Dapoer Palem — Inspired by Nature.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const { getConfiguredMetadata } = await import("@/lib/settings/public");
  const configured = await getConfiguredMetadata();
  return {
    ...fallbackMetadata,
    ...configured,
    openGraph: { ...fallbackMetadata.openGraph, ...configured.openGraph },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${bodyFont.variable} ${headingFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
