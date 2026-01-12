
import { GoogleGenAI, Type } from "@google/genai";
import { InterviewData, FeedbackSummary, MatchAnalysis } from "../types";

export const getGeminiApiKey = (): string => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
  const key = (storedKey || envKey || '').trim();
  if (!key) {
    throw new Error('Gemini API key is missing. Set VITE_GEMINI_API_KEY or add one in Settings.');
  }
  return key;
};

export const getMatchAnalysis = async (data: InterviewData): Promise<MatchAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following CV and Job Description. Provide a match analysis.
    
    CV: ${data.cvText}
    Job Description: ${data.jobDescription}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchPercentage: { type: Type.NUMBER, description: "0-100 score of how well the candidate matches the role" },
          keyRequirements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Main things the job asks for" },
          resumeHighlights: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Best parts of the CV that match the job" },
          interviewStrategy: { type: Type.STRING, description: "How the AI should approach the interview" }
        },
        required: ["matchPercentage", "keyRequirements", "resumeHighlights", "interviewStrategy"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const prepareQuestions = async (data: InterviewData) => {
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on the following CV and Job Description, generate 5-7 targeted interview questions.
    
    CV: ${data.cvText}
    Job Description: ${data.jobDescription}`,
    config: {
      temperature: 0.7,
    }
  });
  return response.text;
};

export const generateFeedback = async (transcript: string, jd: string): Promise<FeedbackSummary> => {
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this job interview transcript against the Job Description. Provide a detailed evaluation.
    
    Job Description: ${jd}
    Transcript: ${transcript}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          overallScore: { type: Type.NUMBER, description: "A score from 0-100" },
          detailedAnalysis: { type: Type.STRING }
        },
        required: ["strengths", "improvements", "overallScore", "detailedAnalysis"]
      }
    }
  });

  const text = response.text || "{}";
  return JSON.parse(text);
};
