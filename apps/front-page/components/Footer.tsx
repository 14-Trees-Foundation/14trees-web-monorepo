"use client";

import Link from "next/link";
import labels from "~/assets/labels.json";
import { IconsAttribution } from "./Partials/Icons";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { preserveReferralParams } from "~/utils";

export default function Footer() {
  const searchParams = useSearchParams();
  return (
    <footer className="bg-[#363e39] py-8 text-gray-300 md:py-12">
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="flex flex-wrap items-start justify-between">
          <div className="px-8 mb-8 w-full md:mb-0 md:w-auto">
            <div className="max-w-[200px] text-center">
              <Image
                src="/logo.png"
                width={100}
                height={100}
                alt="Logo"
                className="mx-auto mb-6"
              />
              <Link href={preserveReferralParams("/", searchParams)} className="text-xl font-bold md:text-2xl">
                {labels.site.title}
              </Link>
            </div>
          </div>

          <div className="hidden md:block border-l h-[150px] border-gray-400 pr-6 self-center"></div>

          <div className="px-8 mb-8 w-full md:mb-0 md:w-auto">
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href={preserveReferralParams("/activity-reports", searchParams)} className="hover:text-white">
                  Activity Reports
                </Link>
              </li>
              <li>
                <Link href={preserveReferralParams("/blogs", searchParams)} className="hover:text-white">
                  Blogs
                </Link>
              </li>
              <li>
                <Link href={preserveReferralParams("/team", searchParams)} className="hover:text-white">
                  Team
                </Link>
              </li>
              <li>
                <Link href={preserveReferralParams("/volunteer", searchParams)} className="hover:text-white">
                  Volunteer
                </Link>
              </li>
            </ul>
          </div>

          <div className="px-8 w-full md:w-auto">
            <h3 className="mb-4 text-lg font-semibold">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href={preserveReferralParams("/80g", searchParams)} className="hover:text-white">
                  80G Certificate
                </Link>
              </li>
              <li>
                <Link
                  href={preserveReferralParams("/contact", searchParams)}
                  className="mt-4 block hover:text-white md:mt-0 md:inline-block"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href={preserveReferralParams("/policies", searchParams)}
                  className="mt-4 block hover:text-white md:mt-0 md:inline-block"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="px-8 mb-8 w-full md:mb-0 md:w-auto">
            <h3 className="mb-4 text-lg font-semibold">Attribution</h3>
            <IconsAttribution />
            <div className="opacity-70 mx-auto mt-2 text-left text-xs text-gray-200">
              <p>
                © {new Date().getFullYear()} {labels.site.title}
              </p>
              <p> All rights reserved</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
