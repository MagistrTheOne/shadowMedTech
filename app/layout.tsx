import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shadow MedTech AI - Voice AI Training Simulator",
  description: "Next-generation voice AI training simulator that creates realistic dialogues with simulated doctors to train pharmaceutical sales representatives. Powered by GigaChat AI.",
  keywords: "medical training, pharmaceutical sales, AI simulation, voice training, doctor simulation, medical education",
  authors: [{ name: "MagistrTheOne" }],
  creator: "MagistrTheOne",
  publisher: "Shadow MedTech AI",
  openGraph: {
    title: "Shadow MedTech AI - Voice AI Training Simulator",
    description: "Realistic doctor simulations for pharmaceutical sales training",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shadow MedTech AI",
    description: "Voice AI training simulator for pharmaceutical sales representatives",
    creator: "@MagistrTheOne",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
