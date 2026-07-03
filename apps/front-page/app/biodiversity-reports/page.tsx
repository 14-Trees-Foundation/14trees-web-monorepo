import { PdfPreviewCard } from "components/Partials/PdfPreviewCard";

const BiodiversityReports = () => {
  const reports = [
    {
      href: "/documents/biodiversity-reports/2023-24.pdf",
      title: "Biodiversity Report FY 2023-24",
      thumbnail: "/documents/thumbnails/biodiversity-reports-2023-24-01.png",
    },
    {
      href: "/documents/biodiversity-reports/2024-25.pdf",
      title: "Biodiversity Report FY 2024-25",
      thumbnail: "/documents/thumbnails/biodiversity-reports-2024-25-01.png",
    },
    {
      href: "/documents/biodiversity-reports/2025-26.pdf",
      title: "Biodiversity Report FY 2025-26",
      thumbnail: "/documents/thumbnails/biodiversity-reports-2025-26-01.png",
    },
  ];

  return (
    <div className="container min-h-screen max-w-screen-lg bg-white py-32 px-6">
      <h1 className="title-text mb-16 text-center">Biodiversity Reports</h1>
      {reports.length === 0 ? (
        <p className="text-center text-gray-500">Reports coming soon.</p>
      ) : (
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
      )}
    </div>
  );
};

export default BiodiversityReports;
