import { PdfPreviewCard } from "components/Partials/PdfPreviewCard";

const AnnualReports = () => {
  const reports = [
    {
      href: "/documents/annual-reports/2020-21.pdf",
      title: "Annual Activity Report - FY 2020-21",
      thumbnail: "/documents/thumbnails/annual-reports-2020-21-01.png",
    },
    {
      href: "/documents/annual-reports/2021-22.pdf",
      title: "Annual Activity Report - FY 2021-22",
      thumbnail: "/documents/thumbnails/annual-reports-2021-22-01.png",
    },
    {
      href: "/documents/annual-reports/2022-23.pdf",
      title: "Annual Activity Report - FY 2022-23",
      thumbnail: "/documents/thumbnails/annual-reports-2022-23-01.png",
    },
    {
      href: "/documents/annual-reports/2023-24.pdf",
      title: "Annual Activity Report - FY 2023-24",
      thumbnail: "/documents/thumbnails/annual-reports-2023-24-01.png",
    },
    {
      href: "/documents/annual-reports/2024-25.pdf",
      title: "Annual Activity Report - FY 2024-25",
      thumbnail: "/documents/thumbnails/annual-reports-2024-25-01.png",
    },
    {
      href: "/documents/annual-reports/2025-26.pdf",
      title: "Annual Activity Report - FY 2025-26",
      thumbnail: "/documents/thumbnails/annual-reports-2025-26-01.png",
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
            thumbnail={report.thumbnail}
          />
        ))}
      </div>
    </div>
  );
};

export default AnnualReports;
