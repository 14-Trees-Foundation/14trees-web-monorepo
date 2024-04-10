import { DocCard } from "app/activity-reports/page";

const FinancialReports = () => {
  const reports = [
    {
      href: "/documents/financial-reports/2020-21.pdf",
      title: "Audited Financial Report FY 2020-21",
    },
    {
      href: "/documents/financial-reports/2021-22.pdf",
      title: "Audited Financial Report FY 2021-22",
    },
    {
      href: "/documents/financial-reports/2022-23.pdf",
      title: "Audited Financial Report FY 2022-23",
    },
  ];

  return (
    <div className="container min-h-screen max-w-screen-md bg-white py-32">
      <h1 className="title-text mb-24 text-center">Financial Reports</h1>
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


export default FinancialReports;
