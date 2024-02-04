"use client";

import Image from "next/image";
import Link from "next/link";
// import { SunIcon } from "@heroicons/react/24/outline";
// import { MoonIcon } from "@heroicons/react/24/outline";
type NavItem = {
  name: string;
  link: string;
  external?: boolean;
  sub?: Array<NavItem>;
};
import logo from "~/assets/images/logo.png";
import { DropDown } from "ui";
import { Button } from "ui/components/button";
import { Fragment } from "react";
import navItems from "~/data/nav.json";

export default function Header() {
  // const [theme, setTheme] = useState<"light" | "dark">("light");
  const setAppTheme = (theme: "light" | "dark") => {
    const root = window.document.documentElement;
    root.classList.remove(theme === "light" ? "dark" : "light");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
    // setTheme(theme);
  };

  // set theme from local storage on load
  // useEffect(() => {
  //   const theme = localStorage?.getItem("theme");
  //   if (theme === "dark") {
  //     setAppTheme("dark");
  //   } else {
  //     setAppTheme("light");
  //   }
  // }, []);
  return (
    <div className="fixed top-0 z-20 w-full">
      <nav className="mx-auto flex items-center justify-between bg-white p-3 shadow-sm shadow-slate-100">
        <div className="mx-3 inline-flex items-center whitespace-nowrap text-xl font-semibold tracking-tight">
          14 Trees Foundation
          <Image
            className="mx-1"
            src={logo}
            height="32"
            width="32"
            alt="logo"
          />
        </div>
        <div className="inline-flex">
          {navItems.map((navItem) => (
            <div key={navItem.name} className="hidden px-4 py-1 md:block">
              <Item navItem={navItem} />
            </div>
          ))}
          <Button>
            <Link href={"/contribute"}>Contribute</Link>
          </Button>
          {/* <button className="h-6 w-6 m-2" onClick={() => setAppTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <SunIcon/> : <MoonIcon/>}
          </button> */}
        </div>
      </nav>
    </div>
  );
}

const Item = ({ navItem }: { navItem: NavItem }) => {
  return (
    <>
      {!navItem.sub ? (
        <Link href={navItem.link} title={navItem.name} className="header-link">
          {navItem.name}
        </Link>
      ) : (
        <div className="">
          <DropDown
            main={<span className="header-link">{navItem.name}</span>}
            items={navItem.sub.map((subItem, index) => (
              <Fragment key={index}>
                <li className="list-none">
                  <div className="h-full w-full rounded-xl py-2 transition-colors duration-300 ease-in-out hover:bg-gray-100">
                    <Link className="p-2" href={subItem.link}>
                      {subItem.name}
                    </Link>
                  </div>
                </li>
              </Fragment>
            ))}
          />
        </div>
      )}
    </>
  );
};
