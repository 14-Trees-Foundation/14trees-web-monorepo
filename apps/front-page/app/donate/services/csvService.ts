import Papa from 'papaparse';
import { DedicatedName } from '../types';
import { VALIDATION_PATTERNS } from '../utils/validation';

export interface CSVUploadResult {
  data: DedicatedName[];
  errors: string[];
  totalTrees: number;
}

export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  processedData: DedicatedName[];
}

export class CSVService {
  private static readonly HEADER_MAP: Record<string, string> = {
    'Recipient Name': 'recipient_name',
    'Recipient Email': 'recipient_email',
    'Recipient Communication Email (optional)': 'recipient_communication_email',
    'Recipient Phone (optional)': 'recipient_phone',
    'Number of trees to assign': 'trees_count',
    'Assignee Name': 'assignee_name',
    'Assignee Email (optional)': 'assignee_email',
    'Assignee Communication Email (optional)': 'assignee_communication_email',
    'Assignee Phone (optional)': 'assignee_phone',
    'Relation with the person': 'relation',
    'Image Name (optional)': 'image'
  };

  private static transformHeader(header: string): string {
    const transformed = CSVService.HEADER_MAP[header] || header.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '');
    console.log(`Header transformation: "${header}" -> "${transformed}"`);
    return transformed;
  }

  private static validateRow(row: DedicatedName, index: number): string[] {
    const rowErrors: string[] = [];

    // Clean and normalize the recipient name
    const cleanedName = row.recipient_name ? String(row.recipient_name).trim() : '';

    // Debug logging to understand the parsing issue
    console.log(`Row ${index + 1} debug:`, {
      raw_row: row,
      recipient_name: row.recipient_name,
      cleaned_name: cleanedName,
      recipient_name_type: typeof row.recipient_name,
      recipient_name_length: cleanedName.length,
      regex_test: cleanedName ? VALIDATION_PATTERNS.name.test(cleanedName) : 'undefined'
    });

    if (!cleanedName) {
      rowErrors.push("Recipient name is required");
    } else if (!VALIDATION_PATTERNS.name.test(cleanedName)) {
      // More lenient check - just ensure it's not empty and has some valid characters
      if (!/^[^\x00-\x1F\x7F]+$/.test(cleanedName)) {
        rowErrors.push("Recipient name contains invalid characters");
      } else {
        console.warn(`Name "${cleanedName}" failed regex but contains valid characters, allowing it`);
      }
    }

    if (row.recipient_email && !VALIDATION_PATTERNS.email.test(String(row.recipient_email))) {
      rowErrors.push("Invalid Recipient Email format");
    }

    if (row.assignee_email && !VALIDATION_PATTERNS.email.test(String(row.assignee_email))) {
      rowErrors.push("Invalid Assignee Email format");
    }

    if (row.recipient_phone && !VALIDATION_PATTERNS.phone.test(String(row.recipient_phone))) {
      rowErrors.push("Invalid Recipient Phone number (10-15 digits required)");
    }

    if (row.assignee_phone && !VALIDATION_PATTERNS.phone.test(String(row.assignee_phone))) {
      rowErrors.push("Invalid Assignee Phone number (10-15 digits required)");
    }

    return rowErrors;
  }

  private static processRowData(row: DedicatedName): DedicatedName {
    // Clean and normalize the recipient name, removing any extra quotes or whitespace
    const cleanedRecipientName = row.recipient_name 
      ? String(row.recipient_name).trim().replace(/^["']|["']$/g, '') 
      : '';

    const processedRow: DedicatedName = {
      recipient_name: cleanedRecipientName,
      recipient_email: row.recipient_email ? String(row.recipient_email).trim() : "",
      recipient_phone: row.recipient_phone ? String(row.recipient_phone) : '',
      trees_count: row.trees_count ? parseInt(String(row.trees_count)) : 1,
      image: row.image ? String(row.image) : undefined,
      relation: row.relation ? String(row.relation) : 'other',
      assignee_name: "",
      assignee_email: "",
      assignee_phone: "",
    };

    // Set assignee details
    if (row.assignee_name?.toString().trim()) {
      processedRow.assignee_name = String(row.assignee_name).trim().replace(/^["']|["']$/g, '');
      processedRow.assignee_email = row.assignee_email ? String(row.assignee_email).trim() : "";
      processedRow.assignee_phone = row.assignee_phone ? String(row.assignee_phone) : '';
    } else {
      processedRow.assignee_name = processedRow.recipient_name;
      processedRow.assignee_email = processedRow.recipient_email;
      processedRow.assignee_phone = processedRow.recipient_phone;
    }

    return processedRow;
  }

  private static checkDuplicateNames(data: DedicatedName[]): string[] {
    const errors: string[] = [];
    const nameCounts: Record<string, number> = {};

    data.forEach((row) => {
      const name = row.recipient_name?.trim().toLowerCase();
      if (name) nameCounts[name] = (nameCounts[name] || 0) + 1;
    });

    Object.entries(nameCounts).forEach(([name, count]) => {
      if (count > 1) {
        errors.push(`Duplicate recipient name detected: "${name}" appears ${count} times`);
      }
    });

    return errors;
  }

  static async parseCSV(file: File, maxTreeCount: number): Promise<CSVUploadResult> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        quoteChar: '"',
        escapeChar: '"',
        delimiter: ',',
        newline: '\n',
        encoding: 'UTF-8',
        transformHeader: (header: string) => CSVService.transformHeader(header),
        complete: (results) => {
          try {
            console.log('Papa Parse results:', results);
            
            // Check for parsing errors
            if (results.errors && results.errors.length > 0) {
              console.warn('Papa Parse errors:', results.errors);
              // Filter out non-critical errors (like empty lines)
              const criticalErrors = results.errors.filter(error => 
                !error.message.includes('Too few fields') && 
                !error.message.includes('Blank row')
              );
              if (criticalErrors.length > 0) {
                console.error('Critical parsing errors:', criticalErrors);
              }
            }
            
            const data = results.data as DedicatedName[];
            console.log('Parsed data:', data);
            const errors: string[] = [];
            const validRecipients: DedicatedName[] = [];

            // Calculate total trees from CSV
            const totalTreesInCsv = data.reduce((sum, row) => {
              const trees = row.trees_count ? parseInt(String(row.trees_count)) : 1;
              return sum + trees;
            }, 0);

            // Check if total trees exceed the donation tree count
            if (totalTreesInCsv > maxTreeCount) {
              errors.push(`Total number of trees in CSV (${totalTreesInCsv}) exceeds the selected number of trees (${maxTreeCount})`);
            }

            // Check for duplicate names
            const duplicateErrors = this.checkDuplicateNames(data);
            errors.push(...duplicateErrors);

            // Process each row
            data.forEach((row, index) => {
              const rowErrors = this.validateRow(row, index);
              const processedRow = this.processRowData(row);
              
              // Add row errors to processed row for UI display
              (processedRow as any)._errors = rowErrors;
              validRecipients.push(processedRow);
            });

            resolve({
              data: validRecipients,
              errors,
              totalTrees: totalTreesInCsv
            });
          } catch (error: any) {
            reject(new Error(`Error processing CSV: ${error.message}`));
          }
        },
        error: (error) => {
          reject(new Error(`Error parsing CSV: ${error.message}`));
        }
      });
    });
  }

  static validateImages(
    csvData: DedicatedName[],
    uploadedFiles: FileList,
    existingErrors: string[] = []
  ): { errors: string[]; updatedData: DedicatedName[] } {
    const newErrors = [...existingErrors];
    const updatedData = [...csvData];
    const expectedImageNames = csvData.map((row, idx) => 
      row.image ? String(row.image).toLowerCase() : null
    ).filter(Boolean);

    // Check for images not in CSV or not matching assignee name if no image in CSV
    Array.from(uploadedFiles).forEach(file => {
      const fileName = file.name.toLowerCase();
      let matched = false;

      csvData.forEach((recipient, idx) => {
        const imageNameInCsv = recipient.image ? String(recipient.image).toLowerCase() : null;
        const assigneeName = recipient.recipient_name 
          ? String(recipient.recipient_name).toLowerCase().replace(/\s+|_/g, '') 
          : null;
        const fileNameNoExt = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/\s+|_/g, '');

        if (imageNameInCsv) {
          // If image name is provided in CSV, only allow exact match
          if (fileName === imageNameInCsv) {
            matched = true;
            // Remove any previous error for this row about image name mismatch
            const rowErrorIdx = newErrors.findIndex(err => 
              err.includes(`Row ${idx + 1}:`) && err.includes('Image name does not match')
            );
            if (rowErrorIdx !== -1) newErrors.splice(rowErrorIdx, 1);
            updatedData[idx] = { ...updatedData[idx], image: URL.createObjectURL(file) };
          }
        } else if (assigneeName) {
          // If no image name in CSV, allow if file name matches assignee name
          if (fileNameNoExt === assigneeName) {
            matched = true;
            // Remove any previous error for this row about image name mismatch
            const rowErrorIdx = newErrors.findIndex(err => 
              err.includes(`Row ${idx + 1}:`) && err.includes('Image name does not match')
            );
            if (rowErrorIdx !== -1) newErrors.splice(rowErrorIdx, 1);
            updatedData[idx] = { ...updatedData[idx], image: URL.createObjectURL(file) };
          }
        }
      });

      if (!matched) {
        newErrors.push(`Image '${file.name}' does not match any required image name or assignee name in the CSV.`);
      }
    });

    return { errors: newErrors, updatedData };
  }

  static async downloadSampleCSV(): Promise<void> {
    const url = "https://docs.google.com/spreadsheets/d/106tLjWvjpKLGuAuCSDu-KFw4wmfLkP9UwoSbJ0hRXgU/gviz/tq?tqx=out:csv&sheet=Sheet1";
    const fileName = "UserDetails.csv";

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      throw new Error("Failed to download sample CSV");
    }
  }
}