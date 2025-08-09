// Shared utility functions for CSV data transformations

export interface CsvRow {
  'Recipient Name': string;
  'Recipient Email': string;
  'Recipient Communication Email': string;
  'Number of Trees': string;
}

export interface DedicatedName {
  recipient_name: string;
  recipient_email: string;
  recipient_communication_email?: string;
  assignee_name: string;
  assignee_email: string;
  relation: string;
  trees_count: number;
}

/**
 * Transforms CSV row data to DedicatedName format
 * Used by both donate and plant-memory sections
 */
export const transformCsvRowToDedicatedName = (row: CsvRow): DedicatedName => {
  return {
    recipient_name: row['Recipient Name'],
    recipient_email: row['Recipient Email'] || '',
    recipient_communication_email: row['Recipient Communication Email'] || '',
    assignee_name: row['Recipient Name'],
    assignee_email: row['Recipient Email'] || '',
    relation: 'other',
    trees_count: parseInt(row['Number of Trees']) || 1
  };
};

/**
 * Transforms DedicatedName back to CSV row format
 * Useful for data export or initial data population
 */
export const transformDedicatedNameToCsvRow = (name: DedicatedName): CsvRow => {
  return {
    'Recipient Name': name.recipient_name,
    'Recipient Email': name.recipient_email?.toString() || '',
    'Recipient Communication Email': name.recipient_communication_email?.toString() || '',
    'Number of Trees': name.trees_count.toString()
  };
};

/**
 * Validates if total trees from CSV data exceeds maximum allowed
 */
export const validateTreeCount = (
  transformedData: DedicatedName[], 
  maxTrees: number
): boolean => {
  const totalTrees = transformedData.reduce((sum, name) => sum + (name.trees_count || 0), 0);
  return totalTrees > maxTrees;
};

/**
 * Creates standard CSV data processing result
 */
export const createCsvProcessingResult = (
  validData: CsvRow[],
  hasParsingErrors: boolean,
  transformedData: DedicatedName[],
  maxTrees: number
) => {
  const hasTreeCountError = validateTreeCount(transformedData, maxTrees);
  
  return {
    validData,
    hasErrors: hasParsingErrors || hasTreeCountError
  };
};