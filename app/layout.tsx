import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jodatransfer — تحويل أموال أسرع وأفضل سعر للطلاب",
  description:
    "حوّل بين الجنيه السوداني والرنقت الماليزي والجنيه المصري والريال السعودي والدرهم الإماراتي والروبل الروسي و USDT — في الاتجاهين. أفضل الأسعار، تحويل سريع، دعم عبر واتساب.",
  metadataBase: new URL("https://jodatransfer.com"),
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Jodatransfer",
    description: "تحويل أموال سريع وعادل للطلاب الدوليين.",
    type: "website",
    images: ["/logo-full.png"],
  },
};

export const viewport = { themeColor: "#030B1F" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-ink font-body antialiased transition-colors duration-300 selection:bg-primary selection:text-bg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
