import Papa from 'papaparse';
import { BankRecord, BookRecord } from '../types';

// Helper to parse "dd/mm/yyyy" to Date object
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    // Note: Month is 0-indexed in JS Date
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return null;
};

// Helper to clean amount string "2,080.00" -> 2080.00
const parseAmount = (amountStr: string): number => {
  if (!amountStr) return 0;
  // Remove commas and convert to float
  return parseFloat(amountStr.replace(/,/g, ''));
};

export const parseBookCSV = (file: File): Promise<BookRecord[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data.map((row: any, index) => ({
            id: `book-${index}`,
            document_no: row.document_no,
            posting_date: row.posting_date,
            description: row.description,
            amount: parseAmount(row.amount),
            originalAmount: row.amount,
            dateObject: parseDate(row.posting_date)
          }));
          resolve(data);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });
};

export const parseBankCSV = (file: File): Promise<BankRecord[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data.map((row: any, index) => ({
            id: `bank-${index}`,
            account_no: row.account_no,
            transaction_date: row.transaction_date,
            time: row.time,
            invoice_number: row.invoice_number,
            product: row.product,
            total_amount: parseAmount(row.total_amount),
            originalAmount: row.total_amount,
            dateObject: parseDate(row.transaction_date),
            merchant_id: row.merchant_id,
            fuel_brand: row.fuel_brand
          }));
          resolve(data);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });
};