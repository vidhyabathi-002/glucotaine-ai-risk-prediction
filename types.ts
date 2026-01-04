
export type Gender = 'Male' | 'Female';

export interface PatientData {
  glucose: number;
  creatinine: number;
  age: number;
  gender: Gender;
}

export enum RiskLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High'
}

export interface PredictionResult {
  riskScore: number;
  riskLevel: RiskLevel;
  glucoseStatus: string;
  creatinineStatus: string;
  recommendation: string;
  explanation: string;
  timestamp: string;
}

export interface PredictionHistoryItem extends PredictionResult {
  id: string;
  input: PatientData;
}
