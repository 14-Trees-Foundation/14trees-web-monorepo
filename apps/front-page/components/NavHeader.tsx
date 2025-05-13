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
  DropdownMenuItem,
} from "ui/components/dropdown-menu";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
// import { DropDown } from "ui";

function getDonationAction() {
  return (
    <div className="relative w-full">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="bg-green-800 w-full text-white px-4 py-2 rounded-md cursor-pointer">
          Donate
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white shadow-md rounded-md p-2">
          <Link href="/donate" className="header-link">
            <DropdownMenuItem
              className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
            >
              Personal Donation
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem
            className="py-2 px-4 text-gray-400 cursor-not-allowed"
            disabled
          >
            Corporate Donation (coming soon)
          </DropdownMenuItem>
          <DropdownMenuItem
            className="py-2 px-4 text-gray-400 cursor-not-allowed"
            disabled
          >
            Donation for a campaign (coming soon)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div >
  );
}

function getGiftTreesAction() {
  return (
    <div className="relative w-full">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="bg-green-800 w-full text-white px-4 py-2 rounded-md cursor-pointer">
          Gift Trees
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white shadow-md rounded-md p-2">
          <Link href="/gift-trees " className="header-link">
            <DropdownMenuItem
              className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
            >
              Personal Gifting
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem
            className="py-2 px-4 text-gray-400 cursor-not-allowed"
            disabled
          >
            Corporate Gifting (coming soon)
          </DropdownMenuItem>
          <DropdownMenuItem
            className="py-2 px-4 text-gray-400 cursor-not-allowed"
            disabled
          >
            Pre-purchased Gift cards (coming soon)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div >
  );
}

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
      <nav className="relative z-50 bg-[#ffffffdf] px-4 py-2 md:px-6 md:py-3 shadow-md shadow-[#48484826] backdrop-blur-lg">
        <div className="mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="mx-3 inline-flex items-center whitespace-nowrap text-xl font-semibold tracking-tight"
          >
            14 Trees Foundation
            <Image className="mx-1" src={logo} height="32" width="32" alt="logo" />
          </Link>

          {/* Mobile menu trigger */}
          <details className="relative md:hidden">
            <summary className="list-none cursor-pointer px-4">
              <ChevronDownIcon className="h-6 w-6" />
            </summary>

            <div className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md p-2 z-50">
              <NavItemsDesktop items={navItems} />
              <Link href="/volunteer">
                <Button variant="secondary" className="w-full mt-2">
                  Volunteer
                </Button>
              </Link>

              <div className="relative w-full mt-2">
                {getDonationAction()}
              </div>

              <div className="relative w-full mt-2">
                {getGiftTreesAction()}
              </div>
            </div>
          </details>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center">
            <div className="flex-grow md:hidden">
              <ChevronDownIcon className="h-6 w-6" onClick={toggleMobileMenu} />
            </div>
            <div className="mx-4 hidden items-center overflow-hidden md:inline-flex">
              <NavItemsDesktop items={navItems} />
            </div>
            <Link href="/volunteer">
              <Button className="mr-3" variant="secondary">
                Volunteer
              </Button>
            </Link>

            <div className="mr-3">
              {getDonationAction()}
            </div>

            <div className="mr-3">
              {getGiftTreesAction()}
            </div>
          </div>
        </div>
      </nav>
      <nav
        className={`grid w-full grid-cols-2 bg-[#ffffffdf] shadow-md shadow-[#48484826] backdrop-blur-lg ${mobileMenuOpen ? "block" : "hidden"
          }`}
      >
        <NavItemsMobile items={navItems} onClick={toggleMobileMenu} />
      </nav>
    </div>
  );
}

const NavItemsMobile = ({
  items,
  onClick,
}: {
  items: Array<NavItem>;
  onClick: any;
}) => {
  return (
    <>
      {items.map((navItem) => (
        <div
          key={navItem.name}
          className="my-auto border-r border-zinc-200 px-4 py-2 md:px-8"
        >
          <Item navItem={navItem} />
        </div>
      ))}
      <div className="my-auto border-r border-zinc-200 px-4 py-1 md:px-8">
        <Item
          navItem={{
            name: "Donate",
            link: "https://docs.google.com/forms/d/e/1FAIpQLSfumyti7x9f26BPvUb0FDYzI2nnuEl5HA63EO8svO3DG2plXg/viewform",
            external: true,
          }}
        />
      </div>
      <div className="my-auto border-r border-zinc-200 px-4 py-1 md:px-8">
        <Item
          navItem={{
            name: "Volunteer",
            link: "https://docs.google.com/forms/d/1GMOqEe605KweKR2aLxPRJKrUtHGhbVdFm4B5GrCisnU/edit",
            external: true,
          }}
        />
      </div>
    </>
  );
};

const NavItemsDesktop = ({ items }: { items: Array<NavItem> }) => {
  return items.map((navItem) => (
    <div
      key={navItem.name}
      className="my-2 border-zinc-200 px-2 text-xs md:text-sm lg:px-6"
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
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="inline-flex whitespace-nowrap">
              {navItem.name} <ChevronDownIcon className="inline h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {navItem.sub.map((subItem, index) => (
                <Fragment key={index}>
                  <Link href={subItem.link} className="header-link">
                    <DropdownMenuItem className="py-3 pl-2 pr-5">
                      {subItem.name}
                    </DropdownMenuItem>
                  </Link>
                </Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </>
  );
};
