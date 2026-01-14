
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import InputPhase from './components/InputPhase';
import AnalysisPhase from './components/AnalysisPhase';
import VoiceInterview from './components/VoiceInterview';
import FeedbackPhase from './components/FeedbackPhase';
import HistoryView from './components/HistoryView';
import DBManagerModal from './components/DBManagerModal';
import { persistenceService } from './services/persistenceService';
import { InterviewStage, InterviewData, TranscriptionEntry, SavedInterview, SyncStatus, DBConfig, MatchAnalysis, FeedbackSummary } from './types';

const App: React.FC = () => {
  const [stage, setStage] = useState<InterviewStage>(InterviewStage.HISTORY);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [interviewData, setInterviewData] = useState<InterviewData>({ cvText: '', jobDescription: '', subject: '' });
  const [transcript, setTranscript] = useState<TranscriptionEntry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackSummary | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isDBModalOpen, setIsDBModalOpen] = useState(false);
  
  const dbConfig: DBConfig = {
    host: 'localhost',
    project: 'local-dev',
    status: 'connected'
  };

  const saveCurrentState = useCallback(async (updates: Partial<SavedInterview>) => {
    if (!currentSessionId) return;
    const existing = persistenceService.getInterviewById(currentSessionId);
    if (existing) {
      const updated = {
        ...existing,
        ...updates,
        updatedAt: Date.now()
      };
      await persistenceService.saveInterview(updated, (status) => setSyncStatus(status));
    }
  }, [currentSessionId]);

  const startAnalysis = async (data: InterviewData) => {
    const newId = crypto.randomUUID();
    const newSession: SavedInterview = {
      id: newId,
      subject: data.subject,
      data,
      transcript: [],
      feedback: null,
      matchAnalysis: null,
      updatedAt: Date.now()
    };
    setCurrentSessionId(newId);
    setInterviewData(data);
    setTranscript([]);
    setFeedback(null);
    setStage(InterviewStage.PREPARING);
    await persistenceService.saveInterview(newSession, (status) => setSyncStatus(status));
  };

  const onAnalysisComplete = async (analysis: MatchAnalysis) => {
    await saveCurrentState({ matchAnalysis: analysis });
    setStage(InterviewStage.READY);
  };

  const onAnalysisReady = async (analysis: MatchAnalysis) => {
    await saveCurrentState({ matchAnalysis: analysis });
  };

  const startInterview = () => setStage(InterviewStage.IN_PROGRESS);

  const endInterview = async (finalTranscript: TranscriptionEntry[]) => {
    setTranscript(finalTranscript);
    await saveCurrentState({ transcript: finalTranscript });
    setStage(InterviewStage.FEEDBACK);
  };

  const restartInterview = () => {
    setFeedback(null); // Clear old feedback so it regenerates
    setTranscript([]);
    setStage(InterviewStage.READY);
  };

  const loadSession = (session: SavedInterview) => {
    setCurrentSessionId(session.id);
    setInterviewData(session.data);
    setTranscript(session.transcript);
    setFeedback(session.feedback || null);
    
    if (session.feedback) {
      setStage(InterviewStage.FEEDBACK);
    } else if (session.matchAnalysis) {
      setStage(InterviewStage.READY);
    } else {
      setStage(InterviewStage.PREPARING);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header 
        onHistoryClick={() => setStage(InterviewStage.HISTORY)} 
        syncStatus={syncStatus}
        onDBIconClick={() => setIsDBModalOpen(true)}
      />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {stage === InterviewStage.HISTORY && (
          <HistoryView 
            onSelect={loadSession} 
            onNew={() => setStage(InterviewStage.INPUT)}
            onDelete={(id) => persistenceService.deleteInterview(id).then(() => setStage(InterviewStage.HISTORY))}
          />
        )}

        {stage === InterviewStage.INPUT && <InputPhase onSubmit={startAnalysis} />}
        
        {stage === InterviewStage.PREPARING && (
          <AnalysisPhase data={interviewData} onComplete={onAnalysisComplete} onAnalysisReady={onAnalysisReady} />
        )}

        {stage === InterviewStage.READY && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex justify-center">
              <div className="bg-blue-100 text-blue-600 p-6 rounded-full ring-8 ring-blue-50">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Ready to Interview</h2>
              <p className="text-slate-500 mt-2">The AI recruiter for "{interviewData.subject}" is on the line.</p>
            </div>
            <div className="flex justify-center gap-4">
              <button onClick={startInterview} className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-200"></span>
                </span>
                Join Session
              </button>
            </div>
          </div>
        )}

        {stage === InterviewStage.IN_PROGRESS && <VoiceInterview data={interviewData} onEnd={endInterview} />}

        {stage === InterviewStage.FEEDBACK && (
          <FeedbackPhase 
            transcript={transcript} 
            jobDescription={interviewData.jobDescription}
            existingFeedback={feedback}
            onRestart={restartInterview}
            onHistory={() => setStage(InterviewStage.HISTORY)}
            onSaveFeedback={(f) => {
              setFeedback(f);
              saveCurrentState({ feedback: f });
            }}
          />
        )}
      </main>

      {isDBModalOpen && <DBManagerModal config={dbConfig} onClose={() => setIsDBModalOpen(false)} />}
    </div>
  );
};

export default App;
