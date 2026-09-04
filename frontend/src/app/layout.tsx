import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#080c14",
};

export const metadata: Metadata = {
  title: "VidGuru AI — Human-Like AI Educator That Teaches Through Video",
  description:
    "VidGuru AI is a personalized AI teacher that takes your PDF, notes, or topic and teaches it step-by-step with an animated avatar, neural voice, real-time whiteboard visuals, Socratic questioning, misconception diagnosis, and adaptive explanations — in English, Hindi, or Hinglish.",
  keywords: [
    "AI teacher",
    "personalized learning",
    "video-based AI educator",
    "adaptive teaching",
    "RAG PDF learning",
    "multilingual AI tutor",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
