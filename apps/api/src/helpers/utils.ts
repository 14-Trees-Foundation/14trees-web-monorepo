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

export const getUniqueRequestId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Database utility functions
export const getSchema = (): string => {
    return process.env.POSTGRES_SCHEMA || '14trees_2';
}

// Internal Testing Utilities for Email-Based Razorpay Account Switching
const INTERNAL_TEST_EMAILS = [
    'vivayush@gmail.com'
];

const INTERNAL_TEST_DOMAINS = [
    '@14trees.org'
];

/**
 * Check if an email belongs to an internal testing user
 * @param email - User's email address
 * @returns true if the user should use test Razorpay account
 */
export const isInternalTestUser = (email: string): boolean => {
    if (!email) return false;
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check specific emails
    if (INTERNAL_TEST_EMAILS.includes(normalizedEmail)) {
        return true;
    }
    
    // Check domains
    return INTERNAL_TEST_DOMAINS.some(domain => 
        normalizedEmail.endsWith(domain.toLowerCase())
    );
};

/**
 * Get Razorpay configuration based on user email
 * @param email - User's email address
 * @returns Razorpay configuration object (test or production)
 */
export const getRazorpayConfig = (email: string) => {
    if (isInternalTestUser(email)) {
        return {
            key_id: process.env.RAZORPAY_TEST_KEY_ID || '',
            key_secret: process.env.RAZORPAY_TEST_KEY_SECRET || ''
        };
    }
    return {
        key_id: process.env.RAZORPAY_KEY_ID || '',
        key_secret: process.env.RAZORPAY_KEY_SECRET || ''
    };
};