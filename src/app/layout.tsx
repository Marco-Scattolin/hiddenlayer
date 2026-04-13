import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import FeedbackButton from "@/components/FeedbackButton";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HiddenLayer",
  description: "Trova attività locali senza presenza web",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${inter.variable} antialiased`}>
        {children}
        <FeedbackButton />
      </body>
    </html>
  );
}
