import type { Metadata } from "next";
import { Boldonse, Geist, Geist_Mono } from "next/font/google";
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
  title: "Beat Boy 3000",
  description: "beat boy 3000 <3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
      <h1 className="flex w-screen justify-center pt-5 py-5 font-bold text-3xl bg-zinc-800">
        Beat Boy 3000
      </h1>
      {children}
      {
      /*<footer className="fixed top-0 w-full py-4 flex justify-center font-bold text-2xl bg-zinc-800 text-white">
        Test
      </footer>
      */
      }

      </body>
    </html>
  );
}
