import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Python — Learn by Making",
  description: "A game-like journey into Python programming.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}