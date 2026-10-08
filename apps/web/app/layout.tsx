import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anime Clash | Battle. Build. Belong.",
  description: "Create anime matchups, assemble your squad, and discuss every episode without jumping ahead.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
