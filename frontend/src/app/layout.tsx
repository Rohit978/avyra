import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ColdStartGame from "../components/ColdStartGame";

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
  title: "CineVerse — Stream Movies, TV Series & Anime",
  description:
    "Luxury dark-mode cinema discovery and streaming platform for films, episodic series, and anime with personal watchlists.",
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
        <Footer />
        <ColdStartGame />
      </body>
    </html>
  );
}
