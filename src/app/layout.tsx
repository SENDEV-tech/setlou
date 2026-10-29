import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Les icônes et l'image d'aperçu (WhatsApp, réseaux sociaux) viennent des fichiers
// favicon.ico, icon.png, apple-icon.png, opengraph-image.png et twitter-image.png de src/app.
export const metadata: Metadata = {
  metadataBase: new URL("https://setlou.com"),
  title: "Setlou",
  description: "Vendez sur WhatsApp. Encaissez en toute sécurité.",
  applicationName: "Setlou",
  appleWebApp: { capable: true, title: "Setlou", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    siteName: "Setlou",
    locale: "fr_FR",
    title: "Setlou",
    description: "Vendez sur WhatsApp. Encaissez en toute sécurité.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Toaster />
            <PageViewTracker />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
