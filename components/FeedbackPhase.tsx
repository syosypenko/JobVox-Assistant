
import React, { useState, useEffect } from 'react';
import { generateFeedback } from '../services/geminiService';
import { TranscriptionEntry, FeedbackSummary } from '../types';

interface Props {
  transcript: TranscriptionEntry[];
  jobDescription: string;
  existingFeedback?: FeedbackSummary | null;
  onRestart: () => void;
  onHistory?: () => void;
  onSaveFeedback?: (feedback: FeedbackSummary) => void;
}

const FeedbackPhase: React.FC<Props> = ({ transcript, jobDescription, existingFeedback, onRestart, onHistory, onSaveFeedback }) => {
  const [feedback, setFeedback] = useState<FeedbackSummary | null>(existingFeedback || null);
  const [loading, setLoading] = useState(!existingFeedback);

  useEffect(() => {
    if (feedback) return; // Don't re-generate if we already have it

    const analyze = async () => {
      const fullText = transcript.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n');
      try {
        const res = await generateFeedback(fullText, jobDescription);
        setFeedback(res);
        if (onSaveFeedback) onSaveFeedback(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (transcript.length > 0) {
      analyze();
    } else {
      setLoading(false);
    }
  }, [transcript, jobDescription, onSaveFeedback, feedback]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-600">Generating your interview feedback...</p>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold mb-4">No data to analyze</h2>
        <button onClick={onRestart} className="text-blue-600 font-semibold underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold">Interview Results</h2>
            <p className="opacity-80 mt-1">Overall performance analysis based on your responses.</p>
          </div>
          <div className="flex items-center justify-center bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-center">
              <span className="text-5xl font-extrabold">{feedback.overallScore}</span>
              <span className="block text-xs uppercase tracking-widest opacity-80 mt-1">Score</span>
            </div>
          </div>
        </div>

        <div className="p-8 grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Key Strengths</h3>
              <ul className="space-y-3">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="flex gap-3 text-slate-700">
                    <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </section>
            
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Areas for Improvement</h3>
              <ul className="space-y-3">
                {feedback.improvements.map((im, i) => (
                  <li key={i} className="flex gap-3 text-slate-700">
                    <svg className="w-5 h-5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>{im}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Detailed Analysis</h3>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">
                {feedback.detailedAnalysis}
              </div>
            </section>

            {transcript.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Interview Transcript</h3>
                <div className="bg-slate-50 rounded-2xl p-6 max-h-[400px] overflow-y-auto border border-slate-100 space-y-4">
                  {transcript.map((entry, i) => (
                    <div key={i} className={`flex flex-col ${entry.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-tighter">
                        {entry.role === 'user' ? 'You' : 'AI Recruiter'}
                      </span>
                      <div className={`p-4 rounded-2xl text-sm max-w-[85%] shadow-sm ${
                        entry.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                      }`}>
                        {entry.text}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-center gap-4">
          <button 
            onClick={onRestart}
            className="px-8 py-3 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-700 transition-colors shadow-md"
          >
            One More Try
          </button>
          <button 
            onClick={onHistory}
            className="px-8 py-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPhase;
