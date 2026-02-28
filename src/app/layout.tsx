import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Anatoly Tracker",
  description: "Track your workouts, reps, and historical progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // "dark" class forces dark mode globally
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background pb-20 antialiased`}>
        <main className="mx-auto max-w-md p-4">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
