
import React, { useState } from 'react';
import { PatientData, Gender } from '../types';

interface RiskFormProps {
  onPredict: (data: PatientData) => void;
  isLoading: boolean;
}

const RiskForm: React.FC<RiskFormProps> = ({ onPredict, isLoading }) => {
  const [formData, setFormData] = useState<PatientData>({
    glucose: 100,
    creatinine: 1.0,
    age: 45,
    gender: 'Male'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (formData.glucose < 40 || formData.glucose > 500) newErrors.glucose = "Range: 40-500 mg/dL";
    if (formData.creatinine < 0.3 || formData.creatinine > 15) newErrors.creatinine = "Range: 0.3-15 mg/dL";
    if (formData.age < 1 || formData.age > 120) newErrors.age = "Range: 1-120 years";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onPredict(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'gender' ? value : parseFloat(value) || 0
    }));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <i className="fas fa-clipboard-user text-blue-500"></i>
        Patient Biomarkers
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-slate-700">Glucose (mg/dL)</label>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">40 - 500</span>
            </div>
            <input
              type="number"
              name="glucose"
              value={formData.glucose}
              onChange={handleChange}
              className={`w-full px-4 py-2 rounded-xl border ${errors.glucose ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:ring-2 focus:ring-blue-500 transition-all outline-none`}
              placeholder="40-500"
            />
            {errors.glucose && <p className="text-red-500 text-xs mt-1">{errors.glucose}</p>}
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-slate-700">Creatinine (mg/dL)</label>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">0.3 - 15</span>
            </div>
            <input
              type="number"
              step="0.1"
              name="creatinine"
              value={formData.creatinine}
              onChange={handleChange}
              className={`w-full px-4 py-2 rounded-xl border ${errors.creatinine ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:ring-2 focus:ring-blue-500 transition-all outline-none`}
              placeholder="0.3-15"
            />
            {errors.creatinine && <p className="text-red-500 text-xs mt-1">{errors.creatinine}</p>}
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-slate-700">Age (Years)</label>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">1 - 120</span>
            </div>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className={`w-full px-4 py-2 rounded-xl border ${errors.age ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:ring-2 focus:ring-blue-500 transition-all outline-none`}
              placeholder="1-120"
            />
            {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none h-[42px]"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
            isLoading 
              ? 'bg-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg shadow-blue-200'
          }`}
        >
          {isLoading ? (
            <><i className="fas fa-circle-notch fa-spin"></i> Processing AI Prediction...</>
          ) : (
            <><i className="fas fa-stethoscope"></i> Estimate Clinical Risk</>
          )}
        </button>
      </form>
    </div>
  );
};

export default RiskForm;
