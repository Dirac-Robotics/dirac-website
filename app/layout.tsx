import type { Metadata } from "next";
import { Syne, DM_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://diracrobotics.com"),
  title: {
    default: "Dirac Robotics -- Real2Sim pipelines for robotics",
    template: "%s · Dirac Robotics",
  },
  description:
    "Dirac Robotics builds physics-accurate simulation from your real environment, automated. Close the sim-to-real gap.",
  openGraph: {
    title: "Dirac Robotics -- Real2Sim pipelines for robotics",
    description:
      "Physics-accurate simulation from your real environment. Automated.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dirac Robotics",
    description:
      "Physics-accurate simulation from your real environment. Automated.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${syne.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#top"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
