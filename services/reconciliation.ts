import { BankRecord, BookRecord, ReconciliationResult, SmartFix, ErrorType } from '../types';

// Helper: ตรวจสอบว่าตัวเลขสองตัวเป็น Transposition Error หรือไม่ (สลับหลัก)
// กฎ: ผลต่างต้องหารด้วย 9 ลงตัว และชุดตัวเลขต้องเหมือนกัน
const isTranspositionError = (amount1: number, amount2: number): boolean => {
  const diff = Math.abs(amount1 - amount2);
  if (diff === 0 || diff % 0.09 > 0.001 && Math.abs(diff % 9) > 0.001) return false;

  // แปลงเป็น string ตัดทศนิยมและ sort ตัวเลขเพื่อเทียบกัน
  const s1 = amount1.toFixed(2).replace('.', '').split('').sort().join('');
  const s2 = amount2.toFixed(2).replace('.', '').split('').sort().join('');
  
  return s1 === s2;
};

export const reconcileData = (
  bankData: BankRecord[],
  bookData: BookRecord[]
): ReconciliationResult => {
  const matches: ReconciliationResult['matches'] = [];
  const unmatchedBank: BankRecord[] = [];
  const smartFixes = new Map<string, SmartFix>();
  
  // Clone book data to track consumption
  const remainingBookData = [...bookData];

  // --- PHASE 1: STANDARD MATCHING ---
  // Strategy: Bank is the source of truth.
  
  for (const bankRecord of bankData) {
    let bestMatchIndex = -1;
    let bestMatchScore = 0; // 0 to 100

    // Optimization: Filter candidates
    const candidates = remainingBookData.map((book, index) => ({ book, index }));

    for (const { book, index } of candidates) {
      if (!book) continue;

      let currentScore = 0;

      // 1. Amount Check (Critical for auto-match)
      if (Math.abs(bankRecord.total_amount - book.amount) < 0.01) {
        currentScore += 50;
      } else {
        // ถ้ายอดไม่ตรง ข้ามไปก่อน (จะไปเก็บตกใน Phase 2)
        continue; 
      }

      // 2. Invoice / Description Check
      // Normalize strings for comparison
      const cleanInv = bankRecord.invoice_number.trim().toLowerCase();
      const cleanDesc = book.description.trim().toLowerCase();
      
      if (cleanInv && cleanDesc && (cleanDesc.includes(cleanInv) || cleanInv.includes(cleanDesc))) {
        currentScore += 30;
      }

      // 3. Date Check
      if (bankRecord.dateObject && book.dateObject) {
         const diffTime = Math.abs(bankRecord.dateObject.getTime() - book.dateObject.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
         
         if (diffDays === 0) {
            currentScore += 20;
         } else if (diffDays <= 2) {
            currentScore += 10;
         }
      }

      // Determine best match
      if (currentScore > bestMatchScore) {
        bestMatchScore = currentScore;
        bestMatchIndex = index;
      }
    }

    // Threshold for accepting a match
    if (bestMatchIndex !== -1 && bestMatchScore >= 70) {
      matches.push({
        bank: bankRecord,
        book: remainingBookData[bestMatchIndex],
        score: bestMatchScore,
        note: bestMatchScore === 100 ? 'ตรงกันสมบูรณ์' : 'ตรงกันบางส่วน (วันที่คลาดเคลื่อนเล็กน้อย)'
      });
      // Remove matched book record
      remainingBookData.splice(bestMatchIndex, 1);
    } else {
      unmatchedBank.push(bankRecord);
    }
  }

  // --- PHASE 2: AI SMART FIX / ANOMALY DETECTION ---
  // ตรวจสอบรายการใน Book ที่เหลืออยู่ เทียบกับ Bank ที่เหลืออยู่ เพื่อหา Human Error

  const remainingBookList = remainingBookData.filter(b => b !== undefined);

  for (const bookRecord of remainingBookList) {
    for (const bankRecord of unmatchedBank) {
      // 1. ตรวจสอบ: เลขอ้างอิงตรงกัน แต่ ยอดเงินผิด (Human Error: Key-in ผิด)
      const cleanInv = bankRecord.invoice_number.trim();
      const cleanDesc = bookRecord.description.trim();
      
      if (cleanInv !== "" && cleanDesc === cleanInv) {
        // ตรวจสอบว่าเป็น Transposition หรือไม่
        if (isTranspositionError(bankRecord.total_amount, bookRecord.amount)) {
          smartFixes.set(bookRecord.id, {
            bookId: bookRecord.id,
            suggestedBankRecord: bankRecord,
            errorType: ErrorType.TRANSPOSITION,
            confidenceScore: 95,
            reason: 'ตรวจพบตัวเลขสลับหลัก (Transposition Error) โดยมีเลขที่เอกสารตรงกัน',
            diffAmount: bankRecord.total_amount - bookRecord.amount
          });
          break; // เจอแล้วหยุดหาคู่ให้ Book นี้
        } else {
          // ยอดผิดทั่วไป
          smartFixes.set(bookRecord.id, {
            bookId: bookRecord.id,
            suggestedBankRecord: bankRecord,
            errorType: ErrorType.WRONG_AMOUNT,
            confidenceScore: 90,
            reason: 'เลขที่เอกสารตรงกัน แต่ยอดเงินบันทึกไม่ถูกต้อง',
            diffAmount: bankRecord.total_amount - bookRecord.amount
          });
          break;
        }
      }

      // 2. ตรวจสอบ: ยอดเงินตรงกัน แต่ วันที่ผิดพลาดมาก (Human Error: ลงวันที่ผิดเดือน/ปี)
      if (Math.abs(bankRecord.total_amount - bookRecord.amount) < 0.01) {
        // ถ้ายังไม่มีคู่ หรือ ความมั่นใจต่ำกว่า
        if (!smartFixes.has(bookRecord.id)) {
             smartFixes.set(bookRecord.id, {
                bookId: bookRecord.id,
                suggestedBankRecord: bankRecord,
                errorType: ErrorType.DATE_MISMATCH,
                confidenceScore: 80,
                reason: `ยอดเงินตรงกัน (${bookRecord.originalAmount}) แต่วันที่แตกต่างกันเกินเกณฑ์ปกติ`,
                diffAmount: 0
             });
        }
      }
      
      // 3. ตรวจสอบ: Transposition Error โดยไม่มีเลขที่เอกสาร (ความมั่นใจต่ำลงมาหน่อย)
      if (isTranspositionError(bankRecord.total_amount, bookRecord.amount)) {
         if (!smartFixes.has(bookRecord.id)) {
            // เช็คว่าวันที่ใกล้เคียงด้วยไหม เพื่อเพิ่มน้ำหนัก
            let dateScore = 0;
            if (bankRecord.dateObject && bookRecord.dateObject) {
                const diffTime = Math.abs(bankRecord.dateObject.getTime() - bookRecord.dateObject.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays <= 5) dateScore = 10;
            }

            smartFixes.set(bookRecord.id, {
              bookId: bookRecord.id,
              suggestedBankRecord: bankRecord,
              errorType: ErrorType.TRANSPOSITION,
              confidenceScore: 60 + dateScore, // 60-70%
              reason: 'ความเป็นไปได้สูงที่จะเกิดตัวเลขสลับหลัก (Transposition) เนื่องจากผลต่างหารด้วย 9 ลงตัว',
              diffAmount: bankRecord.total_amount - bookRecord.amount
            });
         }
      }
    }
  }

  return {
    matches,
    unmatchedBank,
    unmatchedBook: remainingBookList,
    smartFixes
  };
};