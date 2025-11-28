import React, { useRef } from 'react';
import { Upload, FileType, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  label: string;
  accept?: string;
  onChange: (file: File) => void;
  fileName?: string;
  colorClass: string;
  iconColor?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  accept = ".csv", 
  onChange, 
  fileName,
  colorClass,
  iconColor = "text-slate-400"
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-slate-500 mb-3 ml-1">{label}</label>
      <div 
        className={`border-3 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group ${
          fileName ? 'border-emerald-300 bg-emerald-50/50' : `border-slate-200 hover:scale-[1.02] ${colorClass}`
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          accept={accept} 
          onChange={handleFileChange} 
        />
        
        {fileName ? (
          <div className="text-center">
            <div className="bg-emerald-100 p-3 rounded-full inline-block mb-3">
               <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-base font-bold text-emerald-700">{fileName}</p>
            <p className="text-xs text-emerald-500 mt-1 font-medium bg-emerald-100/50 px-2 py-1 rounded-lg inline-block">อัปโหลดเรียบร้อย</p>
          </div>
        ) : (
          <div className="text-center">
            <div className={`p-4 rounded-2xl inline-block mb-4 transition-colors ${fileName ? '' : 'bg-white shadow-sm'}`}>
               <Upload className={`w-8 h-8 ${iconColor}`} />
            </div>
            <p className="text-base text-slate-500 font-medium">
              <span className={`font-bold underline decoration-2 underline-offset-2 ${iconColor.replace('text-', 'decoration-')}`}>คลิกเพื่ออัปโหลด</span> หรือลากไฟล์มาวาง
            </p>
            <p className="text-xs text-slate-400 mt-2 font-medium">รองรับไฟล์ CSV เท่านั้น</p>
          </div>
        )}
      </div>
    </div>
  );
};