import { PdfPreviewCard } from "components/Partials/PdfPreviewCard";

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
    <div className="container min-h-screen max-w-screen-lg bg-white py-32 px-6">
      <h1 className="title-text mb-16 text-center">Activity Reports</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, index) => (
          <PdfPreviewCard
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
