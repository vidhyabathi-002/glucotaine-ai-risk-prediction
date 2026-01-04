
import { GoogleGenAI, Type } from "@google/genai";
import { PatientData, PredictionResult, RiskLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function predictRisk(data: PatientData): Promise<PredictionResult> {
  // Enforcing medical threshold logic and granular recommendation rules as system context
  const systemPrompt = `
    You are a clinical decision support system for GLUCOTAINE.
    Your task is to estimate the risk of diabetes-induced kidney dysfunction.
    
    MEDICAL CLASSIFICATION RULES:
    1. Glucose: < 100 mg/dL (Normal), 100-125 mg/dL (Prediabetic), >= 126 mg/dL (Diabetic).
    2. Creatinine Upper Limits: Male 1.3 mg/dL, Female 1.1 mg/dL. Anything above is classified as "Elevated".
    3. SAFETY OVERRIDE: IF creatinine >= 2.0 mg/dL, the Risk Level MUST be 'High' and Risk Score MUST be >= 90%.
    
    RISK LEVEL MAPPING:
    - 0-39%: Low Risk
    - 40-69%: Moderate Risk
    - 70-100%: High Risk

    RECOMMENDATION LOGIC:
    - IF Risk Level is 'High' AND Glucose Status is 'Diabetic': Suggest immediate consultation with a nephrologist and endocrinologist for suspected diabetic nephropathy.
    - IF Risk Level is 'High' AND Glucose Status is NOT 'Diabetic': Suggest consulting a physician to investigate non-diabetic causes of renal dysfunction (e.g., hypertension, dehydration, or acute injury).
    - IF Risk Level is 'Moderate': Suggest lifestyle modifications (dietary sodium/sugar reduction), increased hydration, and a follow-up biomarker panel in 3 months.
    - IF Risk Level is 'Low' but biomarkers are slightly off: Suggest routine monitoring and maintaining a balanced diet.
    - IF Risk Level is 'Low' and all biomarkers are normal: Suggest regular annual check-ups.

    The "explanation" field should summarize the clinical reasoning behind the risk score.
  `;

  const userPrompt = `
    Patient Profile:
    - Glucose: ${data.glucose} mg/dL
    - Creatinine: ${data.creatinine} mg/dL
    - Age: ${data.age} years
    - Gender: ${data.gender}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER },
            riskLevel: { type: Type.STRING },
            glucoseStatus: { type: Type.STRING },
            creatinineStatus: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["riskScore", "riskLevel", "glucoseStatus", "creatinineStatus", "recommendation", "explanation"],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      ...result,
      timestamp: new Date().toISOString(),
    } as PredictionResult;
  } catch (error) {
    console.error("Gemini Prediction Error:", error);
    throw new Error("Failed to process clinical prediction. Please try again.");
  }
}
