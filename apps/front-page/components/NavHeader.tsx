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
import { Button } from "ui/components/button";
import { Fragment, useState } from "react";
import navItems from "~/data/nav.json";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "ui/components/dropdown-menu";
import { ArrowDownIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { DropDown } from "ui";

export default function Header() {
  // const [theme, setTheme] = useState<"light" | "dark">("light");
  const setAppTheme = (theme: "light" | "dark") => {
    const root = window.document.documentElement;
    root.classList.remove(theme === "light" ? "dark" : "light");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
    // setTheme(theme);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
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
      <nav className="mx-auto flex items-center justify-between bg-[#ffffffdf] p-1 shadow-md shadow-[#48484826] backdrop-blur-lg">
        <Link
          href={"/"}
          className="mx-3 inline-flex items-center whitespace-nowrap text-xl font-semibold tracking-tight"
        >
          14 Trees Foundation
          <Image
            className="mx-1"
            src={logo}
            height="32"
            width="32"
            alt="logo"
          />
          <ChevronDownIcon className="h-6 w-6" onClick={toggleMobileMenu} />
        </Link>
        <div className="inline-flex px-1 py-1">
          <NavItemsDesktop items={navItems} />
          <Button className="bg-green-800">
            <Link href={"/contribute"}>Contribute</Link>
          </Button>
          {/* <button className="h-6 w-6 m-2" onClick={() => setAppTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <SunIcon/> : <MoonIcon/>}
          </button> */}
        </div>
      </nav>
      <nav
        className={`grid w-full grid-cols-2 bg-[#ffffffdf] shadow-md shadow-[#48484826] backdrop-blur-lg ${
          mobileMenuOpen ? "block" : "hidden"
        }`}
      >
        <NavItemsMobile items={navItems} />
      </nav>
    </div>
  );
}

const NavItemsMobile = ({ items }: { items: Array<NavItem> }) => {
  return items.map((navItem) => (
    <div
      key={navItem.name}
      className="my-auto border-r border-zinc-200 px-8 py-1 lg:hidden"
    >
      <Item navItem={navItem} />
    </div>
  ));
};

const NavItemsDesktop = ({ items }: { items: Array<NavItem> }) => {
  return items.map((navItem) => (
    <div
      key={navItem.name}
      className="my-auto hidden border-zinc-200 px-8 py-1 lg:block"
    >
      <Item navItem={navItem} />
    </div>
  ));
};

const Item = ({ navItem }: { navItem: NavItem }) => {
  return (
    <>
      {!navItem.sub ? (
        <Link href={navItem.link} title={navItem.name} className="header-link">
          {navItem.name}
        </Link>
      ) : (
        <div className="">
          {/* <DropDown
            main={<span className="header-link">{navItem.name}</span>}
            items={navItem.sub.map((subItem, index) => (
              <Fragment key={index}>
                <li className="list-none">
                  <Link href={subItem.link} className="h-full w-full py-2">
                    <div className="p-2 transition-colors duration-300 ease-in-out hover:bg-gray-100 rounded-xl ">
                      {subItem.name}
                    </div>
                  </Link>
                </li>
              </Fragment>
            ))}
          /> */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="whitespace-nowrap">
              {navItem.name} <ChevronDownIcon className="inline h-6 w-6" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {navItem.sub.map((subItem, index) => (
                <Fragment key={index}>
                  <DropdownMenuItem>
                    <Link href={subItem.link} className="">
                      <div className="px-2 py-1 text-base">{subItem.name}</div>
                    </Link>
                  </DropdownMenuItem>
                </Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </>
  );
};
