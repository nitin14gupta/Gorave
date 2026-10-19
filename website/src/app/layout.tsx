import type { Metadata, Viewport } from "next";
import { APP_IDS } from "@/constants/nav";
import localFont from "next/font/local";
import { Instrument_Serif } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { SmartNavbar } from "@/components/layout/SmartNavbar";

const cabinet = localFont({
  variable: "--font-cabinet",
  src: [
    { path: "./fonts/CabinetGrotesk-Medium.otf", weight: "500" },
    { path: "./fonts/CabinetGrotesk-Bold.otf", weight: "700" },
    { path: "./fonts/CabinetGrotesk-Extrabold.otf", weight: "800" },
  ],
});

const satoshi = localFont({
  variable: "--font-satoshi",
  src: [
    { path: "./fonts/Satoshi-Regular.otf", weight: "400" },
    { path: "./fonts/Satoshi-Medium.otf", weight: "500" },
    { path: "./fonts/Satoshi-Bold.otf", weight: "700" },
  ],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gorave.in"),
  title: {
    default: "Gorave · House parties, rooftops & game nights near you",
    template: "%s · Gorave",
  },
  description:
    "Find house parties, rooftops, game nights and dinner parties hosted by real people in your city, or host your own. Verified 18+ guests, private addresses, UPI tickets.",
  applicationName: "Gorave",
  keywords: ["house parties", "rooftop parties", "game nights", "dinner parties", "things to do", "Mumbai", "Bangalore", "Delhi", "Pune", "Gen Z", "India"],
  openGraph: { siteName: "Gorave", type: "website", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
  appleWebApp: { title: "Gorave", statusBarStyle: "default" },
  // Lets Android and Facebook hand gorave.in links to the installed app.
  appLinks: {
    android: { package: APP_IDS.android, app_name: "Gorave" },
    ...(APP_IDS.appStoreId ? { ios: { url: `https://apps.apple.com/app/id${APP_IDS.appStoreId}`, app_store_id: APP_IDS.appStoreId, app_name: "Gorave" } } : {}),
  },
  // Safari's "Open in the app" banner, once the iOS app is live.
  ...(APP_IDS.appStoreId ? { itunes: { appId: APP_IDS.appStoreId } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#f1e9d8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cabinet.variable} ${satoshi.variable} ${instrument.variable}`}>
      <body className="bg-cream text-ink">
        <SmoothScroll>
          <SmartNavbar />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
