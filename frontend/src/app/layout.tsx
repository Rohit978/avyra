import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cineverse — Discover Movies, TV Series & Anime",
  description: "Unified media discovery and catalogue platform for films, episodic series, and anime with legal playback and personal watchlists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-white">
        {children}
      </body>
    </html>
  );
}
