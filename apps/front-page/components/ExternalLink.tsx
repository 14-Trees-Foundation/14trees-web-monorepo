import { ArrowUpRightIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

// export default function ExternalLink({ href, disabled, children }) {
// add types, use react children type utility
export default function ExternalLink({
  href,
  children,
  disabled,
}: Readonly<{
  href: string;
  children: React.ReactNode;
  disabled?: boolean;
}>) {
  if (disabled === true) return (
    <span className="text-gray-500">
      {children}
      <ArrowUpRightIcon className="mb-0.5 ml-0.5 inline-block h-4 w-4" />
      </span>
  );
  return (
    <Link className="external-link" href={href}>
      {children}
      <ArrowUpRightIcon className="mb-0.5 ml-0.5 inline-block h-4 w-4" />
    </Link>
  );
}
