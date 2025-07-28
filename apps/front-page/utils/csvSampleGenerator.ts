// Shared utility for generating CSV sample files

export const generateSampleCsvContent = (): string => {
  const headers = ['Recipient Name', 'Recipient Email', 'Recipient Communication Email', 'Number of Trees'];
  const sampleData = [
    ['John Doe', 'john@example.com', 'john.communication@example.com', '2'],
    ['Jane Smith', 'jane@example.com', '', '5'],
    ['Bob Johnson', 'bob@example.com', 'bob.alt@example.com', '1']
  ];

  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => row.join(','))
  ].join('\n');

  return csvContent;
};

export const downloadSampleCsv = (filename: string = 'sample_recipients.csv'): void => {
  const csvContent = generateSampleCsvContent();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const getCsvHeaders = (): string[] => {
  return ['Recipient Name', 'Recipient Email', 'Recipient Communication Email', 'Number of Trees'];
};

export const validateCsvHeaders = (headers: string[]): { isValid: boolean; missingHeaders: string[] } => {
  const requiredHeaders = getCsvHeaders();
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  
  return {
    isValid: missingHeaders.length === 0,
    missingHeaders
  };
};