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

export const metadata: Metadata = {
  title: "Avyra — Watch Movies, TV Series & Anime Online in HD",
  description:
    "Watch popular movies, top-rated TV series, and sub/dub anime online in HD on Avyra. Browse trending releases, episode guides, official trailers, and sync your personal watchlist.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${jakarta.variable}`}>
      <body className="min-h-screen bg-background cinema-ambient-bg text-foreground font-sans antialiased selection:bg-primary selection:text-white flex flex-col justify-between">
        <Navbar />
        <main className="flex-1">{children}</main>
        <CommandPalette />
      </body>
    </html>
  );
}
