
import React, { useState } from 'react';
import { persistenceService } from '../services/persistenceService';
import { SavedInterview } from '../types';

interface Props {
  onSelect: (session: SavedInterview) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

const HistoryView: React.FC<Props> = ({ onSelect, onNew, onDelete }) => {
  const sessions = persistenceService.getAllInterviewsLocal();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedSession(expandedSession === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Your Sessions</h2>
          <p className="text-sm text-slate-500">View and manage your interview simulations.</p>
        </div>
        <button 
          onClick={onNew}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">No saved sessions yet.</p>
          <button onClick={onNew} className="text-blue-600 font-bold mt-2 hover:underline">Start your first prep session</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <div 
              key={session.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all"
            >
              <div
                className="p-5 flex items-center justify-between group cursor-pointer"
                onClick={() => onSelect(session)}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-lg shadow-inner ${session.feedback ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                    <span className="text-lg leading-none">{session.feedback?.overallScore ?? session.matchAnalysis?.matchPercentage ?? '--'}</span>
                    <span className="text-[8px] uppercase tracking-tighter opacity-70 mt-0.5">{session.feedback ? 'Score' : 'Match'}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{session.subject}</h3>
                      {session.syncStatus === 'synced' && (
                        <div className="group/sync relative">
                          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/sync:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Cloud Synced</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(session.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <div className="flex gap-1">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${session.data.cvText ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-500'}`}>CV</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${session.data.jobDescription ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-500'}`}>JD</span>
                        {session.transcript && session.transcript.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-blue-100 text-blue-600">Transcript</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {(session.matchAnalysis || session.feedback) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleExpanded(session.id); }}
                      className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <svg className={`w-5 h-5 transition-transform ${expandedSession === session.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                    className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded details section */}
              {expandedSession === session.id && (
                <div className="border-t border-slate-200 p-5 bg-slate-50/50 space-y-4">
                  {/* Match Analysis (Before Call) */}
                  {session.matchAnalysis && (
                    <div className="bg-white rounded-xl p-4 border border-blue-100">
                      <h4 className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Pre-Interview Analysis
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Key Requirements</p>
                          <ul className="space-y-1">
                            {session.matchAnalysis.keyRequirements.map((req, i) => (
                              <li key={i} className="flex gap-2 text-xs text-slate-600">
                                <span className="text-blue-500">•</span> {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Your Highlights</p>
                          <ul className="space-y-1">
                            {session.matchAnalysis.resumeHighlights.map((hl, i) => (
                              <li key={i} className="flex gap-2 text-xs text-slate-600">
                                <span className="text-green-500">✓</span> {hl}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Interview Strategy</p>
                        <p className="text-xs text-slate-600 italic">"{session.matchAnalysis.interviewStrategy}"</p>
                      </div>
                    </div>
                  )}

                  {/* Feedback (After Call) */}
                  {session.feedback && (
                    <div className="bg-white rounded-xl p-4 border border-green-100">
                      <h4 className="text-sm font-bold text-green-600 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Post-Interview Feedback
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Strengths</p>
                          <ul className="space-y-1">
                            {session.feedback.strengths.map((strength, i) => (
                              <li key={i} className="flex gap-2 text-xs text-slate-600">
                                <span className="text-green-500">✓</span> {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Areas for Improvement</p>
                          <ul className="space-y-1">
                            {session.feedback.improvements.map((improvement, i) => (
                              <li key={i} className="flex gap-2 text-xs text-slate-600">
                                <span className="text-amber-500">→</span> {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Detailed Analysis</p>
                        <p className="text-xs text-slate-600">{session.feedback.detailedAnalysis}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
