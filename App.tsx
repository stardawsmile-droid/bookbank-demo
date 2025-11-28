import React, { useState, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { ResultTable } from './components/ResultTable';
import { parseBankCSV, parseBookCSV } from './services/parser';
import { reconcileData } from './services/reconciliation';
import { BankRecord, BookRecord, MatchStatus, ErrorType } from './types';
import { FileSpreadsheet, RefreshCw, Download, Sparkles } from 'lucide-react';

function App() {
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  
  const [bankData, setBankData] = useState<BankRecord[]>([]);
  const [bookData, setBookData] = useState<BookRecord[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<MatchStatus>(MatchStatus.MATCHED);

  // Core Reconciliation Logic Triggered when data changes
  const results = useMemo(() => {
    if (bankData.length === 0 || bookData.length === 0) return null;
    return reconcileData(bankData, bookData);
  }, [bankData, bookData]);

  const summaryStats = useMemo(() => {
    if (!results) return null;
    const totalBank = bankData.length;
    const totalBook = bookData.length;
    const matched = results.matches.length;

    // 1. Calculate Error Distribution
    let transpositionCount = 0;
    let dateMismatchCount = 0;
    let wrongAmountCount = 0;

    results.smartFixes.forEach((fix) => {
      if (fix.errorType === ErrorType.TRANSPOSITION) transpositionCount++;
      else if (fix.errorType === ErrorType.DATE_MISMATCH) dateMismatchCount++;
      else if (fix.errorType === ErrorType.WRONG_AMOUNT) wrongAmountCount++;
    });

    const pureUnmatchedBook = results.unmatchedBook.length - results.smartFixes.size;
    
    // 2. Financial Impact (Net Difference of Unmatched)
    const unmatchedBankSum = results.unmatchedBank.reduce((acc, curr) => acc + curr.total_amount, 0);
    const unmatchedBookSum = results.unmatchedBook.reduce((acc, curr) => acc + curr.amount, 0);
    const netDifference = unmatchedBankSum - unmatchedBookSum;

    // 3. AI Insights & Recommendations
    const recommendations: string[] = [];
    const observations: string[] = []; // Changed to array
    let primaryCause = "รายการตกหล่นทั่วไป";

    // --- Generate Bullet Points Observations ---
    
    // Match Rate Observation
    const matchRate = (matched / totalBank) * 100;
    if (matchRate >= 95) {
      observations.push(`ประสิทธิภาพการจับคู่ยอดเยี่ยม (${matchRate.toFixed(1)}%) ระบบบัญชีมีความแม่นยำสูง`);
    } else if (matchRate >= 80) {
      observations.push(`ประสิทธิภาพการจับคู่อยู่ในเกณฑ์ดี (${matchRate.toFixed(1)}%) แต่ยังมีรายการต้องตรวจสอบบางส่วน`);
    } else {
      observations.push(`อัตราการจับคู่ต่ำกว่าเกณฑ์ (${matchRate.toFixed(1)}%) แสดงถึงความคลาดเคลื่อนของข้อมูลสูง`);
    }

    // Error Type Observation
    if (transpositionCount > 0) {
      recommendations.push("ตรวจพบ Human Error (ตัวเลขสลับหลัก) สูง ควรตรวจสอบการป้อนข้อมูลผ่าน Numpad");
      primaryCause = "Human Error (Transposition)";
      observations.push(`ตรวจพบข้อผิดพลาดประเภท "ตัวเลขสลับหลัก" (Transposition) จำนวน ${transpositionCount} รายการ ซึ่งมักเกิดจากการพิมพ์เร็วเกินไป`);
    }
    
    if (dateMismatchCount > matched * 0.1) { // If > 10% of matches
      recommendations.push("พบความคลาดเคลื่อนของวันที่จำนวนมาก ควรตรวจสอบ Timezone หรือ Cut-off time ของระบบ");
      primaryCause = "Timing Difference";
      observations.push("พบรูปแบบการลงวันที่เหลื่อมล้ำ (Date Slip) อย่างมีนัยสำคัญ อาจเกิดจากรอบเวลาตัดยอดที่แตกต่างกัน");
    }

    // Financial Observation
    if (Math.abs(netDifference) > 1000) {
      const status = netDifference > 0 ? "เงินเกิน (Bank > Book)" : "เงินขาด (Book > Bank)";
      observations.push(`ผลต่างสุทธิมีนัยสำคัญ: ${status} จำนวน ${Math.abs(netDifference).toLocaleString()} บาท`);
    } else {
      observations.push("ผลต่างสุทธิอยู่ในเกณฑ์ที่ยอมรับได้ (Balanced)");
    }

    // Unmatched Observation
    if (pureUnmatchedBook > 0 && results.unmatchedBank.length === 0) {
        recommendations.push("มีการบันทึกใน Book มากกว่าความเป็นจริง (Over-recorded) กรุณาตรวจสอบเอกสารซ้ำ");
        observations.push("พบรายการใน Book ที่ไม่มีใน Bank (Possible Over-recording)");
    }

    // Pastel Colors for Chart
    const errorDistribution = [
      { name: 'จับคู่สมบูรณ์', value: matched, color: '#6ee7b7' }, // Emerald 300
      { name: 'เลขสลับหลัก (Fix)', value: transpositionCount, color: '#c4b5fd' }, // Violet 300
      { name: 'วันที่คลาดเคลื่อน (Fix)', value: dateMismatchCount, color: '#fdba74' }, // Orange 300
      { name: 'ตกหล่นใน Bank', value: results.unmatchedBank.length, color: '#fca5a5' }, // Red 300
      { name: 'ตกหล่นใน Book', value: pureUnmatchedBook, color: '#fcd34d' }, // Amber 300
    ].filter(item => item.value > 0);
    
    return {
      totalBankRecords: totalBank,
      totalBookRecords: totalBook,
      matchedCount: matched,
      unmatchedBankCount: results.unmatchedBank.length,
      unmatchedBookCount: results.unmatchedBook.length,
      totalMatchedAmount: results.matches.reduce((sum, m) => sum + m.bank.total_amount, 0),
      matchPercentage: matchRate,
      smartFixCount: results.smartFixes.size,
      analysis: {
        netDifference,
        errorDistribution,
        primaryCause,
        recommendations,
        aiObservation: observations
      }
    };
  }, [results, bankData.length, bookData.length]);

  const handleBankUpload = async (file: File) => {
    setIsProcessing(true);
    setBankFile(file);
    try {
      const data = await parseBankCSV(file);
      setBankData(data);
    } catch (err) {
      alert("Error parsing Bank CSV");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBookUpload = async (file: File) => {
    setIsProcessing(true);
    setBookFile(file);
    try {
      const data = await parseBookCSV(file);
      setBookData(data);
    } catch (err) {
      alert("Error parsing Book CSV");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setBankFile(null);
    setBookFile(null);
    setBankData([]);
    setBookData([]);
  };

  // Function to generate and download Executive Summary
  const handleGlobalExport = () => {
    if (!summaryStats) return;

    const { analysis } = summaryStats;
    const timestamp = new Date().toLocaleString('th-TH');

    const reportContent = `
================================================
   EXECUTIVE SUMMARY (สรุปผลการตรวจสอบยอด)
================================================
Generated by: AutoReconcile Pro AI
Date: ${timestamp}

[1] ภาพรวมประสิทธิภาพ (Performance Snapshot)
------------------------------------------------
• อัตราการจับคู่ (Match Rate):  ${summaryStats.matchPercentage.toFixed(2)}%
• สถานะ: ${summaryStats.matchPercentage >= 95 ? '✅ ยอดเยี่ยม (Excellent)' : summaryStats.matchPercentage >= 80 ? '⚠️ ปานกลาง (Fair)' : '❌ ต้องปรับปรุง (Critical)'}
• จำนวนรายการทั้งหมด: ${summaryStats.totalBankRecords + summaryStats.totalBookRecords} รายการ
• จับคู่สำเร็จ: ${summaryStats.matchedCount} รายการ

[2] ความเสี่ยงทางการเงิน (Financial Risk)
------------------------------------------------
• ผลต่างสุทธิ (Net Difference): ${analysis.netDifference.toLocaleString()} บาท
• สถานะ: ${analysis.netDifference > 0 ? 'Bank Over (เงินเกิน)' : analysis.netDifference < 0 ? 'Book Over (เงินขาด)' : 'Balanced (ยอดตรง)'}
• รายการคงค้างใน Bank: ${summaryStats.unmatchedBankCount} รายการ
• รายการคงค้างใน Book: ${summaryStats.unmatchedBookCount} รายการ

[3] บทวิเคราะห์จาก AI (AI Analysis)
------------------------------------------------
${analysis.aiObservation.map(obs => `• ${obs}`).join('\n')}

[4] สาเหตุหลักของข้อผิดพลาด (Root Cause)
------------------------------------------------
>> ${analysis.primaryCause}

[5] ข้อแนะนำ (Action Items)
------------------------------------------------
${analysis.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

================================================
End of Report
`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Executive_Summary_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-700 pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-violet-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-violet-400 p-2.5 rounded-2xl shadow-lg shadow-violet-200">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">AutoReconcile <span className="text-violet-500">Pro</span></h1>
              <span className="text-xs font-semibold bg-gradient-to-r from-violet-200 to-fuchsia-200 text-violet-700 px-2 py-0.5 rounded-full">AI Powered</span>
            </div>
          </div>
          {results && (
             <button 
             onClick={resetAll}
             className="flex items-center text-sm font-semibold text-slate-500 hover:text-rose-500 transition-colors bg-white border border-slate-200 hover:border-rose-200 px-4 py-2 rounded-full shadow-sm"
           >
             <RefreshCw className="w-4 h-4 mr-2" />
             เริ่มใหม่
           </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Upload Section */}
        {(!results) && (
          <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100 p-10 border border-indigo-50 mb-10">
            <div className="text-center mb-10">
              <div className="inline-block p-3 rounded-full bg-indigo-50 mb-4">
                 <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-3">เริ่มต้นการตรวจสอบยอด</h2>
              <p className="text-slate-500 text-lg">อัปโหลดไฟล์ CSV เพื่อให้ AI ช่วยจับคู่รายการให้อัตโนมัติ</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FileUpload 
                label="1. ไฟล์ Bank Statement (CSV)" 
                fileName={bankFile?.name}
                onChange={handleBankUpload}
                colorClass="border-sky-200 bg-sky-50/50 hover:bg-sky-50 text-sky-600"
                iconColor="text-sky-400"
              />
              <FileUpload 
                label="2. ไฟล์ Book / GL (CSV)" 
                fileName={bookFile?.name}
                onChange={handleBookUpload}
                colorClass="border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-600"
                iconColor="text-rose-400"
              />
            </div>

            {isProcessing && (
              <div className="mt-8 flex justify-center">
                 <div className="bg-violet-50 text-violet-600 px-6 py-3 rounded-full flex items-center shadow-sm animate-pulse font-medium">
                    <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                    กำลังประมวลผลข้อมูล...
                 </div>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {results && summaryStats && (
          <div className="animate-fade-in-up space-y-8">
            <Dashboard stats={summaryStats} />

            {/* Tabs & Table */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="border-b border-slate-100 px-8 py-5 bg-white flex flex-wrap gap-3 items-center justify-between sticky top-0">
                <div className="flex space-x-3 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                  <button
                    onClick={() => setActiveTab(MatchStatus.MATCHED)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                      activeTab === MatchStatus.MATCHED 
                        ? 'bg-emerald-100 text-emerald-700 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    จับคู่สำเร็จ ({summaryStats.matchedCount})
                  </button>
                  <button
                    onClick={() => setActiveTab(MatchStatus.UNMATCHED_BANK)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                      activeTab === MatchStatus.UNMATCHED_BANK 
                        ? 'bg-rose-100 text-rose-700 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    Bank คงเหลือ ({summaryStats.unmatchedBankCount})
                  </button>
                  <button
                    onClick={() => setActiveTab(MatchStatus.UNMATCHED_BOOK)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center ${
                      activeTab === MatchStatus.UNMATCHED_BOOK 
                        ? 'bg-amber-100 text-amber-700 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    Book คงเหลือ ({summaryStats.unmatchedBookCount})
                    {summaryStats.smartFixCount > 0 && (
                      <span className="ml-2 bg-violet-400 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center shadow-sm">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {summaryStats.smartFixCount}
                      </span>
                    )}
                  </button>
                </div>
                
                <button 
                  onClick={handleGlobalExport}
                  className="hidden sm:flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors border border-slate-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Report (Summary)
                </button>
              </div>

              <div className="p-0">
                <ResultTable results={results} activeTab={activeTab} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;