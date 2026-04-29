import type { Metadata } from "next";
import { Inter, Nunito_Sans } from "next/font/google";

import greenshareIcon from "./greenshare-icon.png";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Greenshare Login",
  description: "Secure Greenshare portal login for desktop and mobile devices.",
  icons: {
    icon: greenshareIcon.src,
    shortcut: greenshareIcon.src,
    apple: greenshareIcon.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${nunitoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
