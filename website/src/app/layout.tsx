import type { Metadata } from "next";
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
    default: "Gorave — House parties, rooftops & game nights near you",
    template: "%s · Gorave",
  },
  description:
    "Find house parties, rooftops, game nights and dinner parties hosted by real people in your city — or host your own. Verified 18+ guests, private addresses, UPI tickets.",
  openGraph: { siteName: "Gorave", type: "website", locale: "en_IN" },
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
