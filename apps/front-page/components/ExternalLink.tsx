import { ArrowUpRightIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export default function ExternalLink({ href, children }) {
  return (
    <Link className="external-link" href={href}>
      {children}
      <ArrowUpRightIcon className="mb-0.5 ml-0.5 inline-block h-4 w-4" />
    </Link>
  );
}
