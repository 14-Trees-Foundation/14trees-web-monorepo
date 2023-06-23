import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SunIcon } from "@heroicons/react/24/outline";
import { MoonIcon } from "@heroicons/react/24/outline";
type NavItem = {
    name: string;
    link: string;
    external?: boolean;
    sub?: Array<NavItem>;
}
import logo from "~/assets/images/logo.png";
import {  DropDown } from "ui";

const getNavItems: Array<NavItem> = [
    {
      "name": "Home",
      "link": "/",
      "external": false
    },
    {
      "name": "Projects",
      "link": "#",
      "sub": []
    },
    {
      "name": "Visitor's Corner",
      "link": "/corner",
      "external": false,
      "sub": [{
        "name": "Blogs/Articles",
        "link": "/blogs",
        "external": false
      },{
        "name": "Gallery",
        "link": "/gallery",
        "external": false
      },{
        "name": "Testimonials",
        "link": "/testimonials",
        "external": false
      }]
    },
    {
      "name": "Team",
      "link": "/team",
      "external": false,
      "sub": [ {
          "name": "Founder",
          "link": "/team#founder",
          "external": true 
        },{
          "name": "Board of Directions",
          "link": "/team#board-of-directors",
          "external": true 
        },{
          "name": "Volunteers",
          "link": "/team#volunteers",
          "external": true 
        }  
      ]
    },
     {
      "name": "About",
      "link": "#",
      "sub": [
        {
          "name": "Terms and Conditions",
          "link": "https://docs.google.com/document/u/1/d/e/2PACX-1vRCEdAbIF8iwRrik54Ka_FpOCaO2DLRAgPiaLHUXlJoMVmkguOqdoc0C3rvgwG_vkixzG7XPKY3VFz1/pub#h.w3wa3of6nuhg",
          "external": true
        },
        {
          "name": "Privacy Policy",
          "link": "https://docs.google.com/document/u/1/d/e/2PACX-1vRCEdAbIF8iwRrik54Ka_FpOCaO2DLRAgPiaLHUXlJoMVmkguOqdoc0C3rvgwG_vkixzG7XPKY3VFz1/pub#h.66xkb0x63zyn",
          "external": true
        },
        {
          "name": "Refunds / Cancellations",
          "link": "https://docs.google.com/document/u/1/d/e/2PACX-1vRCEdAbIF8iwRrik54Ka_FpOCaO2DLRAgPiaLHUXlJoMVmkguOqdoc0C3rvgwG_vkixzG7XPKY3VFz1/pub#h.8pq86vig1yd1",
          "external": true
        },
        {
          "name": "Contact",
          "link": "/contact",
          "external": false 
        },
      ]
    },
]

export default function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const setAppTheme = (theme: 'light' | 'dark') => {
      const root = window.document.documentElement;
      root.classList.remove(theme === 'light' ? 'dark' : 'light');
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
      setTheme(theme);
    }

    // set theme from local storage on load
    useEffect(() => {
      const theme = localStorage?.getItem('theme');
      if (theme === 'dark') {
        setAppTheme('dark');
      } else {
        setAppTheme('light');
      }
    }, []);
    return (
      <nav className="flex items-center justify-between mx-auto p-3">
        <div className="inline-flex items-center font-semibold text-xl tracking-tight mx-3 whitespace-nowrap">
            14 Trees Foundation
            <Image className="mx-1" src={logo} height="32" width="32" alt="logo" />
        </div>
        <div className="inline-flex">
          {getNavItems.map(navItem => (
            <div key={navItem.name} className="md:block hidden px-4 py-1">
              <Item navItem={navItem} />
            </div>
          ))}
          {/* primary button: Contribute */}
          <Link href={'/contribute'} className="btn-primary px-4 py-1" >Contribute</Link>
          {/* <button className="h-6 w-6 m-2" onClick={() => setAppTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <SunIcon/> : <MoonIcon/>}
          </button> */}
        </div>
      </nav>
    );
}

const Item = ({ navItem }: { navItem: NavItem}) => {
    return (
      <>
        {!navItem.sub ? (
          <Link
            href={navItem.link}
            title={navItem.name}
            className="header-link"
          >
            {navItem.name}
          </Link>
        ) : (
          <div className="">
            <DropDown
              main={<span className="header-link">{navItem.name}</span>}
              items={navItem.sub.map((subItem) => (
                <li
                  className="list-none"
                  key={subItem.name}
                >
                  <div className="h-full w-full py-2 hover:bg-gray-50 hover:underline underline-offset-2 rounded-xl">
                    <Link className="p-2" href={subItem.link}>{subItem.name}</Link>
                  </div>
                </li>
              ))}
            />
          </div>
        )}
      </>
    );
}