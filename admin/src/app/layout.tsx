import type { Metadata } from "next";
import "./globals.css";
import { bricolage, figtree } from "@/lib/fonts";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastOverlay } from "@/components/ui/ToastOverlay";

const THEME_SCRIPT = `try{var t=localStorage.getItem('gorave-admin-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

export const metadata: Metadata = {
  title: "Gorave Admin",
  description: "Gorave internal admin panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${figtree.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply the saved theme before first paint so the page never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-ink-primary">
        <QueryProvider>
          {children}
          <ToastOverlay />
        </QueryProvider>
      </body>
    </html>
  );
}
