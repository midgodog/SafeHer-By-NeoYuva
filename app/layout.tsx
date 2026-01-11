import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SettingsProvider } from "@/lib/settings-context"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "SafeHer AI - Your Intelligent Safety Companion",
  description:
    "AI-powered women's safety companion with conversational AI, real-time risk assessment, emergency resources, incident documentation, and 24/7 support. Stay safe with SafeHer.",
  generator: "v0.app",
  keywords: [
    "women safety app",
    "AI safety companion",
    "emergency help",
    "women helpline India",
    "safety app for women",
    "personal safety",
    "SOS emergency",
    "risk assessment",
    "incident reporting",
    "women empowerment",
  ],
  authors: [{ name: "SafeHer Team" }],
  creator: "SafeHer",
  publisher: "SafeHer",
  category: "Safety & Security",
  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://safeher.app",
    siteName: "SafeHer AI",
    title: "SafeHer AI - Your Intelligent Safety Companion",
    description:
      "AI-powered women's safety companion with conversational AI, real-time risk assessment, emergency resources, and incident documentation.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SafeHer AI - Women Safety Companion",
      },
    ],
  },
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "SafeHer AI - Your Intelligent Safety Companion",
    description: "AI-powered women's safety companion. Stay safe 24/7.",
    images: ["/og-image.jpg"],
    creator: "@SafeHerApp",
  },
  // App specific
  applicationName: "SafeHer AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SafeHer",
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#A855F7" },
    { media: "(prefers-color-scheme: dark)", color: "#7C3AED" },
  ],
  colorScheme: "light dark",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" />
        <link rel="dns-prefetch" href="https://nominatim.openstreetmap.org" />
      </head>
      <body className="font-sans antialiased min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
        >
          Skip to main content
        </a>
        <SettingsProvider>{children}</SettingsProvider>
        <Analytics />
      </body>
    </html>
  )
}
