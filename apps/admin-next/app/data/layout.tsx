"use client"

import "ui/globals.css";
import "~/index.css";

import { Inter } from "next/font/google";

import { Sidebar } from "components/DataManager/Sidebar";
import { RecoilRoot } from "recoil";

import { ThemeProvider } from "@mui/material/styles";
import theme from "components/DataManager/theme";

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
    <section className="w-full min-h-screen bg-admin-green-2 h-full">
        <div className="container mx-auto">
          <ThemeProvider theme={theme}>
            <RecoilRoot>
              {children}
            </RecoilRoot>
          </ThemeProvider>
        </div>
    </section>
  );
}