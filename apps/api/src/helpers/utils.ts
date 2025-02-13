import { NumberFormat } from 'intl';
import { toWords } from 'number-to-words';
import { Readable } from 'stream';
import csv from 'csv-parser'

export const removeSpecialCharacters = function (str: string) {
    return str.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
}

export const isValidDateString = (str: string) => {
    const date = new Date(str);
    if (isNaN(date.getTime())) {
        return false;
    }

    return true;
}

export const formatNumber = function (number: number) {
    return new NumberFormat('en-IN', { 
      style: 'decimal', 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(number);
}

export const numberToWords = function (number: number) {
    return toWords(number);
}

export async function parseCsv(buffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const results: any[] = [];
        const stream = Readable.from(buffer.toString('utf-8'));
        stream.pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}