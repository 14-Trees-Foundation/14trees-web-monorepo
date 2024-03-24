import Image from "next/image";
import Link from "next/link";

import logo from "~/assets/images/logo.png";

const AnnualReports = () => {
  const reports = [
    {
      href: "/documents/annual-reports/2020-21.pdf",
      title: "Annual Report FY 2020-21",
    },
    {
      href: "/documents/annual-reports/2021-22.pdf",
      title: "Annual Report FY 2021-22",
    },
    {
      href: "/documents/annual-reports/2022-23.pdf",
      title: "Annual Report FY 2022-23",
    },
  ];

  return (
    <div className="container min-h-screen max-w-screen-md bg-white py-32">
      <h1 className="title-text mb-24 text-center">Reports</h1>
      <div>
        {reports.map((report, index) => (
          <DocCard
            key={index}
            title={report.title}
            href={report.href}
            image={logo}
          />
        ))}
      </div>
    </div>
  );
};

function DocCard({ title, href, image }) {
  return (
    <Link href={href}>
      <div className="my-3 w-full cursor-pointer rounded-md border-2 bg-white p-4 transition-colors duration-300 hover:bg-slate-100">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-medium text-gray-700">{title}</h1>
          <Image
            height={64}
            width={64}
            className="mr-4 h-16 w-16"
            src={image}
            alt={title}
          />
        </div>
      </div>
    </Link>
  );
}

export default AnnualReports;
