import "ui/globals.css";
import "~/index.css";

import { Inter } from "next/font/google";
import NavHeader from "components/NavHeader";
import Footer from "components/Footer";

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
        <div className="mt-18">{children}</div>
        <Footer/>
      </body>
    </html>
  );
}
