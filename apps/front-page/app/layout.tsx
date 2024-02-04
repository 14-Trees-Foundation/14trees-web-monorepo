import "ui/globals.css";
import "~/index.css";

import { Inter } from "next/font/google";
import type { Metadata } from "next";
import labels from "~/assets/labels.json";
import NavHeader from "components/NavHeader";

const inter = Inter({ subsets: ["latin"] });

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NavHeader />
        <div className="mt-20">{children}</div>
        {/* footer */}
      </body>
    </html>
  );
}
