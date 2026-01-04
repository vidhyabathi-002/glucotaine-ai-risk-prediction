
import React, { useState } from 'react';
import Header from './components/Header';
import RiskForm from './components/RiskForm';
import ResultsDisplay from './components/ResultsDisplay';
import { PatientData, PredictionResult, PredictionHistoryItem } from './types';
import { predictRisk } from './services/geminiService';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<PredictionResult | null>(null);
  const [lastInput, setLastInput] = useState<PatientData | null>(null);
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async (data: PatientData) => {
    setLoading(true);
    setError(null);
    setLastInput(data);
    try {
      const result = await predictRisk(data);
      setCurrentResult(result);
      
      const newHistoryItem: PredictionHistoryItem = {
        ...result,
        id: Math.random().toString(36).substr(2, 9),
        input: data
      };
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 10)); // Keep last 10
    } catch (err: any) {
      setError(err.message || "An error occurred during prediction.");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (history.length === 0) return;

    const headers = [
      "ID", "Timestamp", "Glucose (mg/dL)", "Creatinine (mg/dL)", "Age", "Gender",
      "Risk Score (%)", "Risk Level", "Glucose Status", "Creatinine Status",
      "Recommendation", "Explanation"
    ];

    const rows = history.map(item => [
      item.id,
      new Date(item.timestamp).toLocaleString(),
      item.input.glucose,
      item.input.creatinine,
      item.input.age,
      item.input.gender,
      item.riskScore,
      item.riskLevel,
      `"${item.glucoseStatus.replace(/"/g, '""')}"`,
      `"${item.creatinineStatus.replace(/"/g, '""')}"`,
      `"${item.recommendation.replace(/"/g, '""')}"`,
      `"${item.explanation.replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `glucotaine_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Console */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="text-3xl font-black mb-2">GLUCOTAINE Smart Screen</h1>
                <p className="text-blue-100 max-w-lg">
                  Advanced AI-enabled screening for diabetes-induced kidney dysfunction. 
                  Input patient biomarkers below to generate an instant clinical risk profile.
                </p>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
            </div>

            <RiskForm onPredict={handlePredict} isLoading={loading} />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-pulse">
                <i className="fas fa-circle-exclamation text-xl"></i>
                <p className="font-semibold">{error}</p>
              </div>
            )}

            {currentResult && lastInput && (
              <ResultsDisplay 
                key={currentResult.timestamp} 
                result={currentResult} 
                inputData={lastInput} 
              />
            )}

            {/* Disclaimer */}
            <div className="bg-white/50 p-6 rounded-2xl border border-slate-200">
              <div className="flex items-start gap-4">
                <div className="bg-slate-200 p-2 rounded-lg text-slate-500">
                  <i className="fas fa-balance-scale"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Ethical & Legal Notice</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    This tool provides preliminary risk estimations for clinical decision support. 
                    It is not a substitute for professional medical diagnosis. 
                    No personal identifiable information (PII) is stored or processed. 
                    Always consult a nephrologist for definitive treatment plans.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - History & Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <i className="fas fa-history text-slate-400"></i>
                  Session History
                </h3>
                {history.length > 0 && (
                  <button 
                    onClick={exportToCSV}
                    className="text-[10px] font-black uppercase tracking-tighter text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                    title="Download current session data as CSV"
                  >
                    <i className="fas fa-file-csv text-sm"></i>
                    Export
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-folder-open text-slate-200 text-4xl mb-2"></i>
                    <p className="text-slate-400 text-sm">No predictions yet this session</p>
                  </div>
                ) : (
                  history.map(item => (
                    <div key={item.id} className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors cursor-default">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          item.riskLevel === 'High' ? 'bg-red-100 text-red-600' : 
                          item.riskLevel === 'Moderate' ? 'bg-amber-100 text-amber-600' : 
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          {item.riskLevel}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700">
                        Gluc: {item.input.glucose} | Creat: {item.input.creatinine}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Risk Trends (Session)</h3>
              {history.length > 1 ? (
                <div className="h-24 flex items-end gap-1 px-2 pt-4">
                  {history.slice().reverse().map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div 
                        className={`w-full rounded-t-sm transition-all duration-500 ${
                          item.riskLevel === 'High' ? 'bg-rose-400' : 
                          item.riskLevel === 'Moderate' ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ height: `${item.riskScore}%` }}
                      ></div>
                      <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[8px] p-1 rounded whitespace-nowrap z-20">
                        Score: {item.riskScore}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-medium text-center px-4">
                    Graph will appear after multiple screenings.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Medical Guidelines</h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Early Screening</p>
                    <p className="text-xs text-slate-500">Detecting albuminuria and EGFR changes via biomarkers.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5"></div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Decision Support</p>
                    <p className="text-xs text-slate-500">Validation of ML intelligence for frontline health workers.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} GLUCOTAINE Systems. Powered by Gemini AI Medical Engine.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
