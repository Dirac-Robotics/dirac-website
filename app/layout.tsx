import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";
import { SITE } from "@/lib/config/site";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HERO_INTRO_SCRIPT, HeroIntro } from "@/components/landing/hero-intro";

const syne = localFont({
  src: "../public/fonts/syne-latin-variable.woff2",
  variable: "--font-syne",
  display: "swap",
  weight: "400 800",
});

// Body face. Variable, so no weight list. Role assignment lives in globals.css.
const inter = localFont({
  src: "../public/fonts/inter-latin-variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

const dmMono = localFont({
  src: "../public/fonts/dm-mono-latin-400.woff2",
  variable: "--font-dm-mono",
  display: "swap",
  weight: "400",
  preload: false,
});

const geistPixel = localFont({
  src: "../public/fonts/geist-pixel-square.woff2",
  variable: "--font-geist-pixel",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Dirac Robotics. From robot to deployment.",
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "Isaac Sim assets",
    "robotics simulation",
    "sim-to-real",
    "Real2Sim",
    "Real2Sim pipeline",
    "USD assets",
    "robot manipulation",
    "physics-accurate simulation",
    "digital twin",
    "robot evaluation",
  ],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "technology",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: SITE.url,
    locale: "en_US",
    title: "Dirac Robotics. From robot to deployment.",
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Dirac Robotics. From robot to deployment.",
    description: SITE.description,
  },
};

// Organization structured data for rich results.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  logo: `${SITE.url}/Logo.png`,
  description: SITE.description,
  email: SITE.contactEmail,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${syne.variable} ${inter.variable} ${dmMono.variable} ${geistPixel.variable} h-full antialiased`}
    >
      <head>
        {/* The intro state must be selected before the first paint, not at hydration. */}
        <script dangerouslySetInnerHTML={{ __html: HERO_INTRO_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <HeroIntro />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
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
