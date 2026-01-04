
import React, { useEffect, useState, useRef } from 'react';
import { PredictionResult, RiskLevel, PatientData } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ResultsDisplayProps {
  result: PredictionResult;
  inputData: PatientData;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, inputData }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const circumference = 2 * Math.PI * 84; // Approximately 527.787

  useEffect(() => {
    let animationFrameId: number;
    const startTime = performance.now();
    const duration = 1500; // 1.5 seconds

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: easeOutQuart
      const easedProgress = 1 - Math.pow(1 - progress, 4);
      
      const currentScoreValue = easedProgress * result.riskScore;
      
      setAnimatedScore(currentScoreValue);
      setDisplayCount(Math.round(currentScoreValue));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [result.riskScore]);

  const getRiskStyles = (level: string) => {
    switch (level) {
      case RiskLevel.LOW:
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          accent: 'bg-emerald-600',
          secondaryBg: 'bg-emerald-100',
          icon: 'fa-circle-check',
          glow: 'shadow-emerald-100',
          label: 'Safe / Low Risk',
          banner: 'bg-emerald-600',
          gradient: 'from-emerald-500 to-teal-600'
        };
      case RiskLevel.MODERATE:
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          accent: 'bg-amber-600',
          secondaryBg: 'bg-amber-100',
          icon: 'fa-triangle-exclamation',
          glow: 'shadow-amber-100',
          label: 'Caution / Moderate Risk',
          banner: 'bg-amber-500',
          gradient: 'from-amber-400 to-orange-500'
        };
      case RiskLevel.HIGH:
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-800',
          accent: 'bg-rose-600',
          secondaryBg: 'bg-rose-100',
          icon: 'fa-circle-exclamation',
          glow: 'shadow-rose-100',
          label: 'Critical / High Risk',
          banner: 'bg-rose-600',
          gradient: 'from-rose-500 to-red-700'
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-800',
          accent: 'bg-slate-600',
          secondaryBg: 'bg-slate-100',
          icon: 'fa-circle-info',
          glow: 'shadow-slate-100',
          label: 'Unknown Status',
          banner: 'bg-slate-600',
          gradient: 'from-slate-500 to-slate-700'
        };
    }
  };

  const styles = getRiskStyles(result.riskLevel);

  const getMarkerPos = (val: number, min: number, max: number) => {
    const pos = ((val - min) / (max - min)) * 100;
    return Math.min(Math.max(pos, 0), 100);
  };

  const downloadPDFReport = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      // Capture the element as a high-quality canvas
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Retain sharpness
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc', // Same as bg-slate-50
      });

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const margin = 10;
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add a header band to the PDF for a clinical feel
      doc.setFillColor(30, 58, 138); // Indigo-900
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("GLUCOTAINE - AI HEALTH STATUS REPORT", margin, 12);
      doc.setFontSize(8);
      doc.text(`Patient ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`, margin, 18);
      doc.text(`Report Timestamp: ${new Date(result.timestamp).toLocaleString()}`, pageWidth - margin, 18, { align: 'right' });

      // Add the captured structured UI
      doc.addImage(imgData, 'PNG', margin, 30, imgWidth, imgHeight);

      // Add footer disclaimer
      const footerY = 35 + imgHeight + 10;
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.setFontSize(7);
      const disclaimer = "CONFIDENTIAL MEDICAL INFORMATION: This document contains AI-generated clinical risk support data based on manual biomarker entry. This is not a formal diagnosis. All findings should be reviewed by a licensed medical professional.";
      const wrappedDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - (margin * 2));
      doc.text(wrappedDisclaimer, margin, footerY);

      doc.save(`GLUCOTAINE_Health_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div 
      ref={reportRef}
      className={`overflow-hidden rounded-2xl border ${styles.border} ${styles.bg} shadow-2xl ${styles.glow} animate-results-entry`}
    >
      <div className={`${styles.banner} px-6 py-3 flex items-center justify-between text-white relative overflow-hidden`}>
        <div className="shimmer absolute inset-0 opacity-20"></div>
        <div className="flex items-center gap-3 relative z-10">
          <i className={`fas ${styles.icon} text-xl`}></i>
          <span className="font-bold tracking-wide uppercase text-sm">{styles.label}</span>
        </div>
        <button 
          onClick={downloadPDFReport}
          disabled={isExporting}
          className="relative z-10 bg-white/20 hover:bg-white/30 text-white text-[10px] font-black px-3 py-1.5 rounded-lg border border-white/40 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isExporting ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-file-pdf"></i>
          )}
          {isExporting ? 'EXPORTING...' : 'DOWNLOAD FULL REPORT'}
        </button>
      </div>

      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Risk Score visualization */}
          <div className="flex flex-col items-center justify-center lg:w-1/3">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
                <defs>
                  <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="currentColor" />
                  </linearGradient>
                </defs>
                <circle
                  cx="96" cy="96" r="84"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="14"
                  className="shadow-inner"
                />
                <circle
                  cx="96" cy="96" r="84"
                  fill="none"
                  stroke="url(#riskGradient)"
                  strokeWidth="14"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={circumference - (circumference * animatedScore) / 100}
                  strokeLinecap="round"
                  className={styles.text}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-black ${styles.text} tabular-nums`}>{displayCount}%</span>
                <span className={`text-xs font-bold uppercase tracking-widest ${styles.text} opacity-60`}>Risk Score</span>
              </div>
            </div>
            
            <div className={`mt-6 w-full flex items-center justify-center gap-2 p-3 rounded-xl ${styles.secondaryBg} border border-white/50 shadow-sm`}>
              <i className={`fas ${styles.icon} ${styles.text} animate-bounce`}></i>
              <span className={`font-black uppercase tracking-tighter ${styles.text}`}>
                {result.riskLevel} Detected
              </span>
            </div>
          </div>

          <div className="flex-grow space-y-6 lg:w-2/3">
            <div className="space-y-4 bg-white/50 p-5 rounded-2xl border border-white/50 shadow-sm">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-chart-line text-blue-500"></i>
                Biomarker Diagnostic Ranges
              </h4>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-600">
                  <span>GLUCOSE LEVEL</span>
                  <span>{inputData.glucose} mg/dL</span>
                </div>
                <div className="relative h-2 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                  <div className="h-full bg-emerald-400" style={{ width: '22%' }}></div>
                  <div className="h-full bg-amber-400" style={{ width: '13%' }}></div>
                  <div className="h-full bg-rose-400" style={{ width: '65%' }}></div>
                </div>
                <div className="relative h-4 w-full">
                  <div 
                    className="absolute -top-3 w-1 bg-slate-800 animate-marker rounded-full"
                    style={{ left: `${getMarkerPos(inputData.glucose, 40, 500)}%`, transition: 'left 1s ease-out' }}
                  >
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold mt-1">
                    <span>40</span>
                    <span>100</span>
                    <span>126</span>
                    <span>500</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-600">
                  <span>CREATININE LEVEL</span>
                  <span>{inputData.creatinine} mg/dL</span>
                </div>
                <div className="relative h-2 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                  <div className="h-full bg-emerald-400" style={{ width: '15%' }}></div>
                  <div className="h-full bg-amber-400" style={{ width: '15%' }}></div>
                  <div className="h-full bg-rose-400" style={{ width: '70%' }}></div>
                </div>
                <div className="relative h-4 w-full">
                  <div 
                    className="absolute -top-3 w-1 bg-slate-800 animate-marker rounded-full"
                    style={{ left: `${getMarkerPos(inputData.creatinine, 0.3, 3.0)}%`, transition: 'left 1s ease-out 0.6s' }}
                  >
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold mt-1">
                    <span>0.3</span>
                    <span>1.1</span>
                    <span>1.3</span>
                    <span>3.0+</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/70 p-4 rounded-2xl border border-white shadow-sm hover:translate-y-[-2px] transition-transform">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-droplet text-blue-500 text-xs"></i>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Glucose Analysis</p>
                </div>
                <p className={`text-lg font-bold ${result.glucoseStatus.toLowerCase().includes('normal') ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {result.glucoseStatus}
                </p>
              </div>
              <div className="bg-white/70 p-4 rounded-2xl border border-white shadow-sm hover:translate-y-[-2px] transition-transform">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-filter text-indigo-500 text-xs"></i>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Renal Filter Capacity</p>
                </div>
                <p className={`text-lg font-bold ${result.creatinineStatus.toLowerCase().includes('elevated') ? 'text-rose-600' : 'text-slate-800'}`}>
                  {result.creatinineStatus}
                </p>
              </div>
            </div>

            <div className="bg-white/90 p-5 rounded-2xl border border-white shadow-sm relative group">
              <div className="absolute -top-3 left-4 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-lg">
                <i className="fas fa-robot mr-1"></i> AI INSIGHT
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium mt-2">
                "{result.explanation}"
              </p>
            </div>

            <div className={`p-5 rounded-2xl border-2 border-white/60 shadow-inner ${styles.secondaryBg}`}>
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-lg ${styles.banner} text-white shadow-lg`}>
                  <i className="fas fa-user-doctor"></i>
                </div>
                <div>
                  <h3 className={`text-sm font-black ${styles.text} uppercase tracking-tight`}>
                    Clinical Recommendation
                  </h3>
                  <p className={`mt-1 text-sm font-bold ${styles.text} leading-snug`}>
                    {result.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
