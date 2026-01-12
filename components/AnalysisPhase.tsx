
import React, { useEffect, useState } from 'react';
import { getMatchAnalysis } from '../services/geminiService';
import { InterviewData, MatchAnalysis } from '../types';

interface Props {
  data: InterviewData;
  onComplete: (analysis: MatchAnalysis) => void;
}

const AnalysisPhase: React.FC<Props> = ({ data, onComplete }) => {
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await getMatchAnalysis(data);
        setAnalysis(res);
        setLoading(false);
      } catch (err) {
        console.error(err);
        // Fallback or retry
      }
    };
    run();
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-xl border border-slate-200">
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-800">Synthesizing Profile Data</h3>
        <p className="text-slate-500 mt-2 max-w-sm text-center">
          Matching your skills against the job requirements...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Preparation Complete</h2>
            <p className="text-slate-500">AI has analyzed your profile for this position.</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-blue-600">{analysis?.matchPercentage}%</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match Score</div>
          </div>
        </div>

        <div className="p-8 grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Key Role Requirements</h4>
              <ul className="space-y-2">
                {analysis?.keyRequirements.map((req, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600">
                    <span className="text-blue-500 font-bold">•</span> {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Top Matching Assets</h4>
              <ul className="space-y-2">
                {analysis?.resumeHighlights.map((hl, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600 bg-green-50 p-2 rounded-lg border border-green-100">
                    <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {hl}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="p-8 bg-blue-50/50 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Interviewer Insight</h4>
          <p className="text-sm text-slate-700 italic">"{analysis?.interviewStrategy}"</p>
        </div>

        <div className="p-6 flex justify-center border-t border-slate-100">
          <button 
            onClick={() => analysis && onComplete(analysis)}
            className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            Start Voice Interview
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPhase;
