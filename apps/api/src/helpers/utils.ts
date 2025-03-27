import { NumberFormat } from 'intl';
import { toWords } from 'number-to-words';

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

export const getUniqueRequestId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}