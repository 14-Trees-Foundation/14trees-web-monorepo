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
import { Fragment, useState, useEffect } from "react";
import navItems from "~/data/nav.json";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "ui/components/dropdown-menu";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/router";
import { usePathname, useSearchParams } from "next/navigation"; // to detect route change
import { preserveReferralParams } from "~/utils";
// import { DropDown } from "ui";

function getDonationAction(searchParams: URLSearchParams | null) {
  return (
    <div className="relative w-full">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="bg-green-800 w-full text-white px-4 py-2 rounded-md cursor-pointer">
          Donate
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white shadow-md rounded-md p-2">
          <Link href={preserveReferralParams("/donate", searchParams)} className="header-link">
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

function getGiftTreesAction(searchParams: URLSearchParams | null) {
  return (
    <div className="relative w-full">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="bg-green-800 w-full text-white px-4 py-2 rounded-md cursor-pointer">
          Plant a Memory
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white shadow-md rounded-md p-2">
          <Link href={preserveReferralParams("/plant-memory", searchParams)} className="header-link">
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

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
          <button className="md:hidden px-4" onClick={toggleMobileMenu}>
            <ChevronDownIcon className="h-6 w-6" />
          </button>

          {mobileMenuOpen && (
            <div className="absolute top-full right-4 mt-2 w-48 bg-white shadow-md rounded-md p-2 z-50 md:hidden">
              <NavItemsDesktop
                items={navItems}
                searchParams={searchParams}
                onClick={() => setMobileMenuOpen(false)} // optional if NavItemsDesktop accepts onClick not here
              />
              <Link href={preserveReferralParams("/volunteer", searchParams)}>
                <Button variant="secondary" className="w-full mt-2" onClick={() => setMobileMenuOpen(false)}>
                  Volunteer
                </Button>
              </Link>
              <Link href={preserveReferralParams("/donate", searchParams)}>
                <Button variant="secondary" className="w-full mt-2" onClick={() => setMobileMenuOpen(false)}>
                  Donate
                </Button>
              </Link>
              <Link href={preserveReferralParams("/plant-memory", searchParams)}>
                <Button variant="secondary" className="w-full mt-2" onClick={() => setMobileMenuOpen(false)}>
                  Plant a Memory
                </Button>
              </Link>
            </div>
          )}

          {/* Desktop nav remains unchanged */}
          <div className="hidden md:flex items-center">
            <div className="mx-4 hidden items-center overflow-hidden md:inline-flex">
              <NavItemsDesktop items={navItems} searchParams={searchParams} />
            </div>
            {/* <Link href="/corporate-login">
            <Button className="mr-3" variant="secondary">
                Corporate Login
                </Button>
              </Link> */}
            <Link href={preserveReferralParams("/volunteer", searchParams)}>
              <Button className="mr-3" variant="secondary">
                Volunteer
              </Button>
            </Link>
            <Link href={preserveReferralParams("/donate", searchParams)}>
              <Button className="mr-3" variant="secondary">
                Donate
              </Button>
            </Link>
            <Link href={preserveReferralParams("/plant-memory", searchParams)}>
              <Button className="mr-3" variant="secondary">
                Plant a Memory
              </Button>
            </Link>
          </div>
        </div>
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

const NavItemsDesktop = ({ items, searchParams, onClick }: { items: Array<NavItem>, searchParams: URLSearchParams | null, onClick?: () => void }) => {
  return items.map((navItem) => (
    <div
      key={navItem.name}
      className="my-2 border-zinc-200 px-2 text-xs md:text-sm lg:px-6"
    >
      <Item navItem={navItem} searchParams={searchParams} onClick={onClick} />
    </div>
  ));
};

const Item = ({ navItem, searchParams, onClick }: { navItem: NavItem, searchParams?: URLSearchParams | null, onClick?: () => void }) => {
  return (
    <>
      {!navItem.sub ? (
        <Link href={navItem.external ? navItem.link : preserveReferralParams(navItem.link, searchParams || null)} onClick={onClick} title={navItem.name} className="header-link text-base md:text-lg">
          {navItem.name}
        </Link>
      ) : (
        <div className="">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="inline-flex items-center whitespace-nowrap text-base md:text-lg">
              {navItem.name} <ChevronDownIcon className="inline h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {navItem.sub.map((subItem, index) => (
                <Fragment key={index}>
                  <Link href={subItem.external ? subItem.link : preserveReferralParams(subItem.link, searchParams || null)} onClick={onClick} className="header-link">
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
