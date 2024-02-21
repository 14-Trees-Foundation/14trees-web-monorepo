import Image from "next/image";
import Link from "next/link";

import logo from "~/assets/images/logo.png";

const MissionPage = () => {
  const reports = [
    "/documents/annual-reports/2020-21.pdf",
    "/documents/annual-reports/2021-22.pdf",
    "/documents/annual-reports/2022-23.pdf",
  ];

  return (
    <div className="min-h-screen bg-white p-32">
      <h1 className="title-text mb-24 text-center">Reports</h1>
      <div>
        {reports.map((report, index) => (
          <DocCard
            key={index}
            title={`Annual Report ${2020 + index}`}
            href={report}
            image={logo}
          />))}
      </div>
    </div>
  );
};

function DocCard({ title, href, image}) {
  return (
     <Link href={href}>
      <div className="w-full cursor-pointer rounded-md bg-white p-4 border-2 my-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl text-gray-700 font-medium">{title}</h1>
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

export default MissionPage;
