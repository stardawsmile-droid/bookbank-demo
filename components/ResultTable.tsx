import React from 'react';
import { ReconciliationResult, MatchStatus, ErrorType } from '../types';
import { Sparkles, ArrowRight, AlertTriangle, CalendarClock, Hash } from 'lucide-react';

interface ResultTableProps {
  results: ReconciliationResult;
  activeTab: MatchStatus;
}

export const ResultTable: React.FC<ResultTableProps> = ({ results, activeTab }) => {
  
  // Render Matched Table
  if (activeTab === MatchStatus.MATCHED) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-600 uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 w-16">สถานะ</th>
              <th className="px-6 py-4 bg-sky-50/50 border-b border-sky-100 text-sky-700 text-center rounded-tl-xl" colSpan={3}>ฝั่งธนาคาร (Bank)</th>
              <th className="px-6 py-4 bg-amber-50/50 border-b border-amber-100 text-amber-700 text-center rounded-tr-xl" colSpan={3}>ฝั่งบัญชี (Book)</th>
            </tr>
            <tr className="border-b border-slate-100">
              <th className="px-6 py-3 bg-slate-50 font-bold">Score</th>
              
              {/* Bank Headers */}
              <th className="px-6 py-3 bg-sky-50/30 text-sky-600 font-semibold">Date</th>
              <th className="px-6 py-3 bg-sky-50/30 text-sky-600 font-semibold">Inv No.</th>
              <th className="px-6 py-3 bg-sky-50/30 text-sky-600 font-semibold text-right">Amount</th>
              
              {/* Book Headers */}
              <th className="px-6 py-3 bg-amber-50/30 text-amber-600 font-semibold">Date</th>
              <th className="px-6 py-3 bg-amber-50/30 text-amber-600 font-semibold">Desc.</th>
              <th className="px-6 py-3 bg-amber-50/30 text-amber-600 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {results.matches.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400 font-medium">ไม่พบรายการที่จับคู่ได้</td></tr>
            ) : (
              results.matches.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                      item.score === 100 
                      ? 'bg-emerald-100 text-emerald-600 border-emerald-200' 
                      : 'bg-yellow-100 text-yellow-600 border-yellow-200'
                    }`}>
                      {item.score}%
                    </span>
                  </td>
                  {/* Bank Data */}
                  <td className="px-6 py-4 text-slate-700 font-medium">{item.bank.transaction_date}</td>
                  <td className="px-6 py-4 text-slate-500">{item.bank.invoice_number}</td>
                  <td className="px-6 py-4 text-right font-bold text-sky-500">{item.bank.originalAmount}</td>
                  
                  {/* Book Data */}
                  <td className="px-6 py-4 text-slate-700 font-medium">{item.book.posting_date}</td>
                  <td className="px-6 py-4 text-slate-500">{item.book.description}</td>
                  <td className="px-6 py-4 text-right font-bold text-amber-500">{item.book.originalAmount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // Render Unmatched Bank
  if (activeTab === MatchStatus.UNMATCHED_BANK) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-rose-700 uppercase bg-rose-50 border-b border-rose-100">
            <tr>
              <th className="px-6 py-4 font-bold">Transaction Date</th>
              <th className="px-6 py-4 font-bold">Invoice No.</th>
              <th className="px-6 py-4 font-bold">Product</th>
              <th className="px-6 py-4 font-bold">Brand</th>
              <th className="px-6 py-4 font-bold text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-50">
            {results.unmatchedBank.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-slate-400 font-medium bg-slate-50/50">ยอดเยี่ยม! ไม่พบรายการตกค้างใน Bank</td></tr>
            ) : (
              results.unmatchedBank.map((row) => (
                <tr key={row.id} className="bg-white hover:bg-rose-50/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">{row.transaction_date}</td>
                  <td className="px-6 py-4">{row.invoice_number}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs">{row.product}</span>
                  </td>
                  <td className="px-6 py-4">{row.fuel_brand}</td>
                  <td className="px-6 py-4 text-right font-bold text-rose-400 text-base">{row.originalAmount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // Render Unmatched Book WITH AI Suggestions
  if (activeTab === MatchStatus.UNMATCHED_BOOK) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-amber-700 uppercase bg-amber-50 border-b border-amber-100">
            <tr>
              <th className="px-6 py-4 font-bold w-1/4">ข้อมูลเดิม (Book)</th>
              <th className="px-6 py-4 font-bold w-1/4 text-right">จำนวนเงิน</th>
              <th className="px-6 py-4 font-bold w-1/2 bg-violet-50 text-violet-700 border-l border-violet-100">
                <div className="flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-violet-500" />
                  AI Smart Fix (ข้อผิดพลาดที่ตรวจพบ)
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.unmatchedBook.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-12 text-slate-400 font-medium">ยอดเยี่ยม! ไม่พบรายการตกค้างใน Book</td></tr>
            ) : (
              results.unmatchedBook.map((row) => {
                const fix = results.smartFixes.get(row.id);
                
                return (
                  <tr key={row.id} className="bg-white hover:bg-amber-50/20 transition-colors">
                    {/* Original Data */}
                    <td className="px-6 py-5 align-top">
                      <div className="font-bold text-slate-700 text-base mb-1">{row.posting_date}</div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">DOC</span>
                        <span className="text-xs text-slate-500 font-mono">{row.document_no}</span>
                      </div>
                      <div className="text-slate-500 text-sm">{row.description}</div>
                    </td>
                    <td className="px-6 py-5 text-right align-top">
                      <span className="font-extrabold text-amber-500 text-lg bg-amber-50 px-3 py-1 rounded-lg">
                        {row.originalAmount}
                      </span>
                    </td>
                    
                    {/* AI Suggestion */}
                    <td className={`px-6 py-5 border-l align-top ${fix ? 'bg-violet-50/20' : ''}`}>
                      {fix ? (
                        <div className="flex flex-col space-y-3">
                          {/* Badge */}
                          <div className="flex items-center space-x-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              fix.errorType === ErrorType.TRANSPOSITION ? 'bg-fuchsia-100 text-fuchsia-600 border-fuchsia-200' :
                              fix.errorType === ErrorType.DATE_MISMATCH ? 'bg-orange-100 text-orange-600 border-orange-200' :
                              'bg-violet-100 text-violet-600 border-violet-200'
                            }`}>
                              {fix.errorType === ErrorType.TRANSPOSITION && "เลขสลับหลัก (Transposition)"}
                              {fix.errorType === ErrorType.DATE_MISMATCH && "วันที่ผิดพลาด (Date Slip)"}
                              {fix.errorType === ErrorType.WRONG_AMOUNT && "ยอดเงินไม่ถูกต้อง"}
                            </span>
                            <span className="text-xs font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
                              {fix.confidenceScore}% confident
                            </span>
                          </div>

                          {/* Reason */}
                          <p className="text-sm text-slate-600 flex items-start leading-relaxed bg-white/50 p-2 rounded-lg">
                             {fix.errorType === ErrorType.TRANSPOSITION && <Hash className="w-4 h-4 mr-2 text-fuchsia-400 mt-0.5 flex-shrink-0" />}
                             {fix.errorType === ErrorType.DATE_MISMATCH && <CalendarClock className="w-4 h-4 mr-2 text-orange-400 mt-0.5 flex-shrink-0" />}
                             {fix.errorType === ErrorType.WRONG_AMOUNT && <AlertTriangle className="w-4 h-4 mr-2 text-violet-400 mt-0.5 flex-shrink-0" />}
                             {fix.reason}
                          </p>

                          {/* Action / Value Comparison */}
                          <div className="mt-1 bg-white p-4 rounded-xl border border-violet-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-violet-300 hover:shadow-md transition-all">
                            <div>
                               <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Suggested Value (Bank)</div>
                               <div className="flex items-center space-x-2">
                                  <span className="font-mono text-xl font-extrabold text-emerald-500">
                                    {fix.suggestedBankRecord.originalAmount}
                                  </span>
                                  {fix.errorType === ErrorType.DATE_MISMATCH && (
                                     <span className="text-sm font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                                       {fix.suggestedBankRecord.transaction_date}
                                     </span>
                                  )}
                               </div>
                            </div>
                            <div className="bg-violet-50 p-2 rounded-full group-hover:bg-violet-100 transition-colors">
                               <ArrowRight className="w-5 h-5 text-violet-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">
                           - No suggestions -
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
};