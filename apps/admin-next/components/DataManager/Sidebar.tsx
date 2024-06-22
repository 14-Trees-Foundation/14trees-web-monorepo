"use client"

import Link from 'next/link';
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import ForestOutlined from "@mui/icons-material/ForestOutlined";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import OpacityOutlined from "@mui/icons-material/OpacityOutlined";
import AccountCircleOutlined from "@mui/icons-material/AccountCircleOutlined";
import FaceIcon from "@mui/icons-material/Face";
import logo from "ui/assets/logo_white_transparent_2.png";
import { useAuth } from "./auth/auth";
import { useState } from 'react';
import Image from 'next/image';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "ui/components/drawer"
import { Button } from 'ui/components/button';
import { XMarkIcon } from '@heroicons/react/24/outline';

import { usePathname } from 'next/navigation';

export const Sidebar = () => {
  const theme = useTheme();
  let auth = useAuth();
  const pathname = usePathname();

  const nav = [
    {
      category: "Data Management",
      pages: [
    {
      displayName: "Tree",
      logo: ForestOutlined,
      path: "/data/tree",
      display: true,
    },
    {
      displayName: "Ponds",
      logo: OpacityOutlined,
      path: "/data/ponds",
      display: true,
    },
    {
      displayName: "Users",
      logo: AccountCircleOutlined,
      path: "/data/users",
      display: auth?.permissions?.includes("all") || true,
    },
    {
      displayName: "Images",
      logo: FaceIcon,
      path: "/data/images",
      display: auth?.permissions?.includes("all") || true,
    },
    {
      displayName: "Forms",
      logo: AssignmentOutlined,
      path: "/data/forms",
      display: true,
    },
  ]},
    {
   category: "Gift Cards",
      pages: [
    {
      displayName: "Gift Cards",
      logo: AssignmentOutlined,
      path: "/gift-cards",
      display: true,
    },
  ],
},
  ];

  const [open, setOpen] = useState(true);

  return (
    <Drawer direction='left'>
      <DrawerTrigger className="text-white absolute top-0 w-32 h-16">
        <MenuIcon />
      </DrawerTrigger>
      <DrawerContent className='left-0 h-full md:w-80 bg-admin-green-1 border-0 text-white'>
        <DrawerHeader>
            <DrawerClose className='flex justify-center'>
              <DrawerTitle className='text-right'>
                <XMarkIcon className='h-5'/>
              </DrawerTitle>
              </DrawerClose>
          {/* <DrawerDescription>This action cannot be undone.</DrawerDescription> */}
       </DrawerHeader>
      <div className="p-4 w-full max-w-lg mx-auto">
       <div className='my-20 mx-auto w-full'>
           <Image className="mx-auto"
             src={logo}
            height="80"
             width="80"
             alt="logo"
           />
       </div>
       { nav.map((navGroup) => (
          <div className='mb-5 pb-5' key={navGroup.category}>
            <h2 className=' text-white font-thin text-3xl'>{navGroup.category}</h2>
           {navGroup.pages.map((item) =>
             item.display ? (
               <Link key={item.path} href={item.path} passHref>
                 <div className={`mt-4 transition-colors duration-150 cursor-pointer flex items-center space-x-2 p-4 rounded-xl shadow-sm ${pathname?.includes(item.path) ? 
                    "shadow-md bg-gradient-to-r from-[#344339] to-[#2d3e32ec]" : "bg-[#4454492d]"}  hover:bg-[#2b392f]`}>
                   <item.logo className="h-6 w-6" />
                   <span>{item.displayName}</span>
                 </div>
               </Link>
             ) : null
           )}
        </div>
       ))}
      </div>
      </DrawerContent>
    </Drawer>
  );
};
