"use client";

import Image from "next/image";
import Link from "next/link";
import { SunIcon } from "@heroicons/react/24/outline";
import { MoonIcon } from "@heroicons/react/24/outline";
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

const getNavItems: Array<NavItem> = [
  {
    name: "Home",
    link: "/",
    external: false,
  },
  {
    name: "Projects",
    link: "#",
    sub: [],
  },
  {
    name: "Visitor's Corner",
    link: "/corner",
    external: false,
    sub: [
      {
        name: "Blogs/Articles",
        link: "/blogs",
        external: false,
      },
      {
        name: "Gallery",
        link: "/gallery",
        external: false,
      },
      {
        name: "Testimonials",
        link: "/testimonials",
        external: false,
      },
    ],
  },
  {
    name: "Team",
    link: "/team",
    external: false,
  },
  {
    name: "About",
    link: "#",
    sub: [
      {
        name: "Vision and Mission",
        link: "/mission",
        external: false,
      },
      {
        name: "Financials and Legal",
        link: "/financials-and-legal",
        external: false,
      },
      {
        name: "Annual Reports",
        link: "/annual-reports",
        external: false,
      },
      {
        name: "Terms and Conditions",
        link: "https://docs.google.com/document/u/1/d/e/2PACX-1vRCEdAbIF8iwRrik54Ka_FpOCaO2DLRAgPiaLHUXlJoMVmkguOqdoc0C3rvgwG_vkixzG7XPKY3VFz1/pub#h.w3wa3of6nuhg",
        external: true,
      },
      {
        name: "Privacy Policy",
        link: "https://docs.google.com/document/u/1/d/e/2PACX-1vRCEdAbIF8iwRrik54Ka_FpOCaO2DLRAgPiaLHUXlJoMVmkguOqdoc0C3rvgwG_vkixzG7XPKY3VFz1/pub#h.66xkb0x63zyn",
        external: true,
      },
      {
        name: "Contact",
        link: "/contact",
        external: false,
      },
    ],
  },
];

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
    <nav className="mx-auto flex items-center justify-between p-3">
      <div className="mx-3 inline-flex items-center whitespace-nowrap text-xl font-semibold tracking-tight">
        14 Trees Foundation
        <Image className="mx-1" src={logo} height="32" width="32" alt="logo" />
      </div>
      <div className="inline-flex">
        {getNavItems.map((navItem) => (
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
                  <div className="h-full w-full rounded-xl py-2 underline-offset-2 hover:bg-gray-50 hover:underline">
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
