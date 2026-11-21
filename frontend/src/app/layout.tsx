import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import CommandPalette from "../components/CommandPalette";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const siteUrl = "https://avyra-vert.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Avyra — Watch Movies, TV Series & Anime Online in HD",
    template: "%s | Avyra",
  },
  description:
    "Watch popular movies, top-rated TV series, and sub/dub anime online in HD on Avyra. Browse trending releases, episode guides, official trailers, and sync your personal watchlist.",
  keywords: [
    "watch movies online",
    "watch anime online",
    "sub dub anime",
    "stream tv series",
    "hd streaming",
    "free movies hd",
    "attack on titan watch",
    "avyra",
  ],
  authors: [{ name: "Avyra" }],
  creator: "Avyra",
  publisher: "Avyra",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Avyra",
    title: "Avyra — Watch Movies, TV Series & Anime Online in HD",
    description:
      "Watch popular movies, top-rated TV series, and sub/dub anime online in HD on Avyra with zero ad bloat and fast streaming.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Avyra — Watch Movies, TV Series & Anime Online in HD",
    description:
      "Watch popular movies, top-rated TV series, and sub/dub anime online in HD on Avyra.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "googlefff92483144c2e0e",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Avyra",
    url: siteUrl,
    description:
      "Watch popular movies, top-rated TV series, and sub/dub anime online in HD on Avyra.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className={`dark ${jakarta.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background cinema-ambient-bg text-foreground font-sans antialiased selection:bg-primary selection:text-white flex flex-col justify-between">
        <Navbar />
        <main className="flex-1">{children}</main>
        <CommandPalette />
      </body>
    </html>
  );
}
