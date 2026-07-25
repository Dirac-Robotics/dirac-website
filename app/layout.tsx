import type { Metadata } from "next";
import { Syne, DM_Mono, Inter } from "next/font/google";

import "./globals.css";
import { SITE } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Body face. Variable, so no weight list. Role assignment lives in globals.css.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://diracrobotics.com"),
  title: {
    default: "Dirac Robotics. Measured-physics simulation assets.",
    template: `%s · ${SITE.name}`,
  },
  description:
    "Physics-accurate Isaac Sim assets built from real objects, with measured mass, inertia, friction, and joint dynamics. Every value carries stated uncertainty.",
  openGraph: {
    title: "Dirac Robotics. Measured-physics simulation assets.",
    description:
      "Isaac Sim asset packs with measured physical properties, not guessed ones.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dirac Robotics",
    description:
      "Isaac Sim asset packs with measured physical properties, not guessed ones.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${syne.variable} ${inter.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
