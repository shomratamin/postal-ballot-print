import type { Metadata } from "next";
import "./globals.css";
import Providers from "./provider";
import NavBar from "@/src/components/Navbar";
import { Locale } from "@/dictionaries/dictionaty";
import { VerifiedUser, verify_cookies } from "@/lib/utils/verifyCookie";
import {
  get_lang_cookie,
  has_lang_cookie,
  set_lang_cookie,
} from "@/lib/store/user/actions";
import { defaultLanguage } from "@/lib/store/user/store";
import { cookies } from "next/headers";
import InstallPWA from "../components/common/InstallPWA";
import PWARegister from "../components/common/PWARegister";

// export const metadata: Metadata = {
//   manifest: "/manifest.json",
//   title: "Bangladesh Post",
//   description: "Created by Bangladesh Post Office",
// };


export const metadata: Metadata = {
  title: 'DMS Counter',
  description: 'Created by Bangladesh Post Office',
  themeColor: '#0f172a', // helps Android taskbar color
  manifest: '/manifest.webmanifest', // auto-served from app/manifest.ts
  icons: {
    icon: [
      { url: '/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icon-167x167.png', sizes: '167x167', type: 'image/png' },
      { url: '/icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-256x256.png', sizes: '256x256', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      // iOS still prefers these for A2HS icon rendering
      { url: '/apple-touch-icon-180.png', sizes: '180x180' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DMS Counter',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let lang: Locale = await get_lang_cookie();
  let cookieStore = await cookies();
  let theme = cookieStore.get("theme")?.value || "light";

  return (
    <html lang={lang}>
      <body>
        <Providers theme={theme}>
          <>
            <InstallPWA />
            <PWARegister />
            {/*<NavBar/> */}
            {/*<NavBar/> */}
            {children}
          </>
        </Providers>
      </body>
    </html>
  );
}
