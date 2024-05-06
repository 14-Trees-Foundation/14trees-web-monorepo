import { DocCard } from "components/Partials/DocCard";

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

export default AnnualReports;
