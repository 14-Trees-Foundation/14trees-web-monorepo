import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import Link from "next/link";

const AnnualReports = () => {
  const reports = [
    {
      href: "/documents/annual-reports/2020-21.pdf",
      title: "Annual Activity Report - FY 2020-21",
    },
    {
      href: "/documents/annual-reports/2021-22.pdf",
      title: "Annual Activity Report - FY 2021-22",
    },
    {
      href: "/documents/annual-reports/2022-23.pdf",
      title: "Annual Activity Report - FY 2022-23",
    },
  ];

  return (
    <div className="container min-h-screen max-w-screen-md bg-white py-32">
      <h1 className="title-text mb-24 text-center">Activity Reports</h1>
      <div>
        {reports.map((report, index) => (
          <DocCard
            key={index}
            title={report.title}
            href={report.href}
          />
        ))}
      </div>
    </div>
  );
};

export function DocCard({ title, href, image }: {
  title: string;
  href: string;
  image?: string | StaticImport;
}) {
  return (
    <Link href={href}>
      <div className="my-3 w-full cursor-pointer rounded-md border-2 border-gray-600 bg-white p-4 transition-colors duration-300 hover:bg-slate-100">
        <div className="flex gap-4 items-center justify-between">
          { image ? (
            <Image
              height={64}
              width={64}
              className="mr-4 h-16 w-16"
              src={image}
              alt={title}
            />
          ) : (
            <div className="w-10 h-10 text-gray-600">
              <DocumentTextIcon className="h-10 w-10" />
            </div>
          )}
          <h1 className="flex-grow text-xl text-left font-medium text-gray-700">{title}</h1>
        </div>
      </div>
    </Link>
  );
}

export default AnnualReports;
