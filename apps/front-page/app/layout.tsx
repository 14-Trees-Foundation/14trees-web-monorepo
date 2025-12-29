import "ui/globals.css";
import "~/index.css";

// import { Lato, Montserrat, Noto_Sans, Nunito_Sans, Roboto, Source_Sans_3 } from 'next/font/google'
import { Inter } from "next/font/google";
import NavHeader from "components/NavHeader";
import Footer from "components/Footer";
import Script from "next/script";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Suspense } from 'react';

const font = Inter({ subsets: ["latin"] });
// const font = Roboto({ weight: ["100", "300", "400", "700"], subsets: ["latin"] , display: "swap"});
// const font = Noto_Sans({ weight: ["100", "300", "400", "700"], subsets: ["latin"] , display: "swap"});
// const font = Nunito_Sans({ weight: ["200", "300", "400", "700"], subsets: ["latin"] , display: "swap"});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-H2ZHBPCZC2"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-H2ZHBPCZC2');
          `}
        </Script>
        
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </head>
      <body className={font.className}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
          <Suspense fallback={<div className="fixed top-0 z-20 w-full bg-white h-16" />}>
            <NavHeader />
          </Suspense>
          <div className="mt-18">{children}</div>
          <Suspense fallback={<div className="bg-[#363e39] py-8 text-gray-300 md:py-12 h-64" />}>
            <Footer />
          </Suspense>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
