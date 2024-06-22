"use client"

import "ui/globals.css";
import "~/index.css";

import { Inter } from "next/font/google";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

import Header from "components/Header";
import { SessionProvider } from 'next-auth/react'
import { Sidebar } from "components/DataManager/Sidebar";

const font = Inter({ subsets: ["latin"] });
// const font = Roboto({ weight: ["100", "300", "400", "700"], subsets: ["latin"] , display: "swap"});
// const font = Noto_Sans({ weight: ["100", "300", "400", "700"], subsets: ["latin"] , display: "swap"});
// const font = Nunito_Sans({ weight: ["200", "300", "400", "700"], subsets: ["latin"] , display: "swap"});

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <SessionProvider>
          <Header />
          <div className="h-full">
            <Sidebar/>
            <div>{children}</div>
          </div>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}


function Footer() {
  return (
    // dark footer with white text
    // logo on the left and links on the right
    <footer>

    </footer>
  )
}