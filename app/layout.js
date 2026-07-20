import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import RouteGuard from "../components/auth/RouteGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Reason: Inter is the primary font for the dashboard — clean SaaS aesthetic.
// How: Loaded via next/font/google and applied as a CSS variable + default body font.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "GrowthOS",
  description: "Client-facing marketing ROI & work-status dashboard.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col bg-[#F8F9FB] text-slate-900"
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        <RouteGuard>
          {children}
        </RouteGuard>
      </body>
    </html>
  );
}
