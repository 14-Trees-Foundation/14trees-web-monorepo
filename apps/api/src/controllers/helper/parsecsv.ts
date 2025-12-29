import fs from 'fs';
import csvParser from 'csv-parser';
import validator from 'validator';

type ValidationResult<T> = {
    valid_records: T[],
    invalid_records: any[],
}

export function validateCSV<T>(filePath: string): Promise<ValidationResult<T>> {
    return new Promise((resolve, reject) => {
      const validRecords: T[] = [];
      const invalidRecords: any[] = [];
  
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row: any) => {
          const name = row["Name"]
          const phone = row["Phone"]
          const email = row["Email ID"]
          const birth_date = row["Date of Birth (optional)"]
          row = { name, phone, email, birth_date }
          // Check if required fields are present
          if (!name || !phone || !email) {
            row["status"] = "error";
            row["message"] = "Required fields are missing";
            invalidRecords.push(row);
            return;
          }
  
          // Validate email format
          if (!validator.isEmail(email)) {
            row["status"] = "error";
            row["message"] = "Invalid email format";
            invalidRecords.push(row);
            return;
          }
  
          // If all validations pass, add to valid records
          validRecords.push(row);
        })
        .on('end', () => {
          resolve({ valid_records: validRecords, invalid_records: invalidRecords });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }