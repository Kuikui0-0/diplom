import type { Metadata } from "next";
import QuickMenu from "@/components/QuickMenu";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Support Platform",
  description: "Платформа поддержки и продвижения мобильных игр",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        {children}
        <QuickMenu />
      </body>
    </html>
  );
}