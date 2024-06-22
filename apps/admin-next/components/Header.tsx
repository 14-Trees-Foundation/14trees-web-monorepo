"use client"

import Link from "next/link";
import Image from "next/image";
import { Button } from "ui/components/button";

import { signIn, useSession } from 'next-auth/react';
import logo from "ui/assets/logo_white_transparent_2.png";

export default function Header() {
  const { data: session } = useSession();

  const login = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  }

  if (session) {
    return <p>You are signed in as {session.user?.email}</p>;
  }

  return (
    <header>
      <nav className="z-20 h-16 w-full text-gray-100 mx-auto flex gap-2 justify-center items-center bg-admin-green-1 p-1 shadow-md shadow-[#48484826] backdrop-blur-lg">
        <Link
          href={"/"}
          className="hidden md:inline-flex items-center ml-3 lg:mr-48 whitespace-nowrap text-2xl font-semibold tracking-tight"
        >
          14 Trees Admin
          <Image className="ml-3 my-2"
            src={logo}
            height="32"
            width="32"
            alt="logo"
          />
        </Link>
        {/* <div className="flex-grow md:hidden">
          <ChevronDownIcon className="h-6 w-6"/>
        </div> */}
        <Link href="/data" className="mx-4">Data Manager</Link>
        <Link href="/gift-cards" className="mx-4">Gift Cards</Link>
        <Button variant="secondary" size="sm" onClick={login}>Login</Button>
      </nav>
    </header>
  );
}