import "ui/globals.css";
import "~/index.css";

// import { Lato, Montserrat, Noto_Sans, Nunito_Sans, Roboto, Source_Sans_3 } from 'next/font/google'
import { Inter } from "next/font/google";
import NavHeader from "components/NavHeader";
import Footer from "components/Footer";
import Script from "next/script";
import { GoogleOAuthProvider } from '@react-oauth/google';

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
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </head>
      <body className={font.className}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
          <NavHeader />
          <div className="mt-18">{children}</div>
          <Footer />
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
