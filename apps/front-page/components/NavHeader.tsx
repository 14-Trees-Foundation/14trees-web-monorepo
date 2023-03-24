import React from "react";
import Image from "next/image";
import Link from "next/link";
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
        }
      ]
    },
    {
      "name": "Dummy",
      "link": "#",
      "sub": [
        {
          "name": "Theme",
          "link": "https://www.github.com/jammeryhq/gridsome-starter-liebling",
          "external": true
        }
      ]
    }
]

export default function Header() {
    return (
      <nav className="flex items-center justify-between container mx-auto py-3">
        <div className="flex items-center">
          <span className="font-semibold text-xl tracking-tight mr-3">14 Trees Foundation</span>
          <div>
            <Image src={logo} height="40" width="40" alt="logo" />
          </div>
        </div>
        <div className="flex">
          {getNavItems.map(navItem => (
            <div key={navItem.name} className="px-4 py-1">
              <Item navItem={navItem} />
            </div>
          ))}
        </div>
      </nav>
    );
}

const Item = ({ navItem }: { navItem: NavItem}) => {
    return (
        <>{ !(navItem.sub) ?
            <Link href={navItem.link} title={navItem.name} className="py-1">{navItem.name}</Link>
            : <div className="w-12">
                <DropDown 
                  main={<Link href={navItem.link}>{navItem.name}</Link>} 
                  items={navItem.sub.map(subItem => 
                    <li key={subItem.name}>
                      <Link href={navItem.link}>{navItem.name}
                      </Link>
                    </li>)
                  }
                />
              </div> 
          }
        </>
    )
}