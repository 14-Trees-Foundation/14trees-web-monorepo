import Papa from 'papaparse';
import { DedicatedName } from '../types/forms';

const VALIDATION_PATTERNS = {
  name: /^[a-zA-Z\s\u00C0-\u017F\u0100-\u024F\u1E00-\u1EFF\u0400-\u04FF\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF\u4E00-\u9FFF\u3400-\u4DBF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF\u0E00-\u0E7F\u0E80-\u0EFF\u0F00-\u0FFF\u1000-\u109F\u10A0-\u10FF\u1200-\u137F\u1380-\u139F\u13A0-\u13FF\u1400-\u167F\u1680-\u169F\u16A0-\u16FF\u1700-\u171F\u1720-\u173F\u1740-\u175F\u1760-\u177F\u1780-\u17FF\u1800-\u18AF\u1900-\u194F\u1950-\u197F\u1980-\u19DF\u19E0-\u19FF\u1A00-\u1A1F\u1A20-\u1AAF\u1AB0-\u1AFF\u1B00-\u1B7F\u1B80-\u1BBF\u1BC0-\u1BFF\u1C00-\u1C4F\u1C50-\u1C7F\u1C80-\u1C8F\u1CC0-\u1CCF\u1CD0-\u1CFF\u1D00-\u1D7F\u1D80-\u1DBF\u1DC0-\u1DFF\u1E00-\u1EFF\u1F00-\u1FFF\u2000-\u206F\u2070-\u209F\u20A0-\u20CF\u20D0-\u20FF\u2100-\u214F\u2150-\u218F\u2190-\u21FF\u2200-\u22FF\u2300-\u23FF\u2400-\u243F\u2440-\u245F\u2460-\u24FF\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF\u27C0-\u27EF\u27F0-\u27FF\u2800-\u28FF\u2900-\u297F\u2980-\u29FF\u2A00-\u2AFF\u2B00-\u2BFF\u2C00-\u2C5F\u2C60-\u2C7F\u2C80-\u2CFF\u2D00-\u2D2F\u2D30-\u2D7F\u2D80-\u2DDF\u2DE0-\u2DFF\u2E00-\u2E7F\u2E80-\u2EFF\u2F00-\u2FDF\u2FF0-\u2FFF\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u3100-\u312F\u3130-\u318F\u3190-\u319F\u31A0-\u31BF\u31C0-\u31EF\u31F0-\u31FF\u3200-\u32FF\u3300-\u33FF\u3400-\u4DBF\u4DC0-\u4DFF\u4E00-\u9FFF\uA000-\uA48F\uA490-\uA4CF\uA4D0-\uA4FF\uA500-\uA63F\uA640-\uA69F\uA6A0-\uA6FF\uA700-\uA71F\uA720-\uA7FF\uA800-\uA82F\uA830-\uA83F\uA840-\uA87F\uA880-\uA8DF\uA8E0-\uA8FF\uA900-\uA92F\uA930-\uA95F\uA960-\uA97F\uA980-\uA9DF\uA9E0-\uA9FF\uAA00-\uAA5F\uAA60-\uAA7F\uAA80-\uAADF\uAAE0-\uAAFF\uAB00-\uAB2F\uAB30-\uAB6F\uAB70-\uABBF\uABC0-\uABFF\uAC00-\uD7AF\uD7B0-\uD7FF\uD800-\uDB7F\uDB80-\uDBFF\uDC00-\uDFFF\uE000-\uF8FF\uF900-\uFAFF\uFB00-\uFB4F\uFB50-\uFDFF\uFE00-\uFE0F\uFE10-\uFE1F\uFE20-\uFE2F\uFE30-\uFE4F\uFE50-\uFE6F\uFE70-\uFEFF\uFF00-\uFFEF\uFFF0-\uFFFF.']+$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[0-9\s\-\(\)]{7,20}$/
};

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
      rowErrors.push("Invalid Recipient Phone number (7-20 digits required)");
    }

    if (row.assignee_phone && !VALIDATION_PATTERNS.phone.test(String(row.assignee_phone))) {
      rowErrors.push("Invalid Assignee Phone number (7-20 digits required)");
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

  static async downloadSampleCSV(): Promise<void> {
    const url = "https://docs.google.com/spreadsheets/d/1Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8/gviz/tq?tqx=out:csv&sheet=Sheet1";
    const fileName = "GiftingRecipients.csv";

    try {
      // Create sample CSV content for gifting
      const sampleContent = `Recipient Name,Recipient Email,Recipient Communication Email (optional),Recipient Phone (optional),Number of trees to assign,Assignee Name,Assignee Email (optional),Assignee Communication Email (optional),Assignee Phone (optional),Relation with the person
John Doe,john@example.com,john.comm@example.com,+1234567890,2,Jane Doe,jane@example.com,jane.comm@example.com,+0987654321,Friend
Alice Smith,alice@example.com,,+1122334455,1,Alice Smith,alice@example.com,,+1122334455,Self
Bob Johnson,bob@example.com,bob.work@example.com,,3,Mary Johnson,mary@example.com,mary.work@example.com,+5566778899,Family`;

      const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
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