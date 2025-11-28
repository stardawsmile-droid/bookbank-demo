export interface BookRecord {
  id: string; // generated
  document_no: string;
  posting_date: string;
  description: string;
  amount: number;
  originalAmount: string; // keep original string for display
  dateObject: Date | null;
}

export interface BankRecord {
  id: string; // generated
  account_no: string;
  transaction_date: string; // Using transaction_date as primary date
  time: string;
  invoice_number: string;
  product: string;
  total_amount: number;
  originalAmount: string;
  dateObject: Date | null;
  merchant_id: string;
  fuel_brand: string;
}

export enum MatchStatus {
  MATCHED = 'MATCHED',
  UNMATCHED_BANK = 'UNMATCHED_BANK',
  UNMATCHED_BOOK = 'UNMATCHED_BOOK',
  POTENTIAL_MATCH = 'POTENTIAL_MATCH' // Date or amount slightly off
}

// AI Analysis Types
export enum ErrorType {
  TRANSPOSITION = 'TRANSPOSITION', // ตัวเลขสลับหลัก (e.g., 5400 -> 4500)
  WRONG_AMOUNT = 'WRONG_AMOUNT',   // เลขอ้างอิงตรง แต่ยอดเงินผิด
  DATE_MISMATCH = 'DATE_MISMATCH', // ยอดตรง แต่วันที่ผิดเกินเกณฑ์
  UNKNOWN = 'UNKNOWN'
}

export interface SmartFix {
  bookId: string;
  suggestedBankRecord: BankRecord;
  errorType: ErrorType;
  confidenceScore: number; // 0-100
  reason: string;
  diffAmount?: number;
}

export interface ReconciliationResult {
  matches: {
    bank: BankRecord;
    book: BookRecord;
    score: number;
    note: string;
  }[];
  unmatchedBank: BankRecord[];
  unmatchedBook: BookRecord[];
  smartFixes: Map<string, SmartFix>; // Key is BookRecord.id
}

export interface AnalysisReport {
  netDifference: number; // ผลต่างสุทธิของรายการที่ไม่ตรงกัน
  errorDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
  primaryCause: string;
  recommendations: string[];
  aiObservation: string[]; // Changed to array for bullet points
}

export interface SummaryStats {
  totalBankRecords: number;
  totalBookRecords: number;
  matchedCount: number;
  unmatchedBankCount: number;
  unmatchedBookCount: number;
  totalMatchedAmount: number;
  matchPercentage: number;
  smartFixCount: number;
  analysis: AnalysisReport; // Added detailed analysis
}