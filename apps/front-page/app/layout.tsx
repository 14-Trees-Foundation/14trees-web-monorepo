import "ui/globals.css";
import "~/index.css";

// import { Lato, Montserrat, Noto_Sans, Nunito_Sans, Roboto, Source_Sans_3 } from 'next/font/google'
import { Inter } from "next/font/google";
import NavHeader from "components/NavHeader";
import Footer from "components/Footer";

const font = Inter({ subsets: ["latin"] });
// const font = Roboto({ weight: ["100", "300", "400", "700"], subsets: ["latin"] , display: "swap"});
// const font = Noto_Sans({ weight: ["100", "300", "400", "700"], subsets: ["latin"] , display: "swap"});
// const font = Nunito_Sans({ weight: ["200", "300", "400", "700"], subsets: ["latin"] , display: "swap"});

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className={font.className}>
        <NavHeader />
        <div className="mt-18">{children}</div>
        <Footer/>
      </body>
    </html>
  );
}
