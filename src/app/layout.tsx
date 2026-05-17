import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Grant2Fund'n — Nonprofit Grant Writing for BC & Alberta",
  description:
    "AI-powered grant writing platform for nonprofits in British Columbia and Alberta. Write compliant, compelling grants faster.",
  openGraph: {
    title: "Grant2Fund'n — Nonprofit Grant Writing for BC & Alberta",
    description:
      "AI-powered grant writing platform for nonprofits in British Columbia and Alberta. Write compliant, compelling grants faster.",
    url: "https://grant2fundn.ca",
    siteName: "Grant2Fund'n",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Grant2Fund'n" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grant2Fund'n — Nonprofit Grant Writing for BC & Alberta",
    description: "AI-powered grant writing for nonprofits in BC & Alberta.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${jakarta.variable}`}>
      <body className="h-full antialiased" style={{ fontFamily: "var(--font-jakarta), var(--font-inter), system-ui, sans-serif", background: "var(--cream)" }}>
        <PostHogProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
