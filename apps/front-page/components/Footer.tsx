import Link from "next/link";
import labels from "~/assets/labels.json";
export default function Footer() {
  return (
    <footer className="bg-[#363e39] py-8 text-gray-300 md:py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-start justify-between">
          <div className="mb-8 w-full md:mb-0 md:w-auto">
            <Link href="/" className="text-xl font-bold md:text-2xl">
              {labels.site.title}
            </Link>
            <p className="mt-2">
              © {new Date().getFullYear()} {labels.site.title}.{" "}
            </p>
            <p> All rights reserved.</p>
          </div>

          <div className="mb-8 w-full md:mb-0 md:w-auto">
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/certificate-of-incorporation"
                  className="hover:text-white"
                >
                  Certificate of Incorporation
                </Link>
              </li>
              <li>
                <Link href="/annual-reports" className="hover:text-white">
                  Annual Reports
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="hover:text-white">
                  Blogs
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-white">
                  News
                </Link>
              </li>
              <li>
                <Link href="/team" className="hover:text-white">
                  Team
                </Link>
              </li>
              <li>
                <Link href="/join-us" className="hover:text-white">
                  Join Us
                </Link>
              </li>
            </ul>
          </div>

          <div className="mb-8 w-full md:mb-0 md:w-auto">
            <h3 className="mb-4 text-lg font-semibold">Connect</h3>
            <div className="flex space-x-4">
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-400"
              >
                FB
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-400"
              >
                TW
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-400"
              >
                IG
              </Link>
              <Link
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-400"
              >
                LI
              </Link>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <h3 className="mb-4 text-lg font-semibold">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="mt-4 block hover:text-white md:mt-0 md:inline-block"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="mt-4 block hover:text-white md:mt-0 md:inline-block"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="mt-4 block hover:text-white md:mt-0 md:inline-block"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="mt-4 block hover:text-white md:mt-0 md:inline-block"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
