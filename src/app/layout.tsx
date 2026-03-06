import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rep Vault",
  description: "Track your workouts, reps, and historical progress.",
  icons: {
    icon: "/icon.png",
  },
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
        <main className="mx-auto w-full max-w-md p-4 lg:max-w-6xl">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
