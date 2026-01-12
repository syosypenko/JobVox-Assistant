
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { InterviewData, TranscriptionEntry } from '../types';
import { getGeminiApiKey } from '../services/geminiService';

interface Props {
  data: InterviewData;
  onEnd: (transcript: TranscriptionEntry[]) => void;
}

// Helper functions for audio processing
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const VoiceInterview: React.FC<Props> = ({ data, onEnd }) => {
  const [isActive, setIsActive] = useState(false);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptionEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const transcriptRef = useRef<TranscriptionEntry[]>([]);
  const currentTranscriptionRef = useRef({ user: '', assistant: '' });

  useEffect(() => {
    startSession();
    return () => {
      stopSession();
    };
  }, []);

  const startSession = async () => {
    try {
      // Re-instantiate ai client for deployment readiness
      const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Crucial for browser compatibility: resume on user gesture
      if (outputAudioContext.state === 'suspended') {
        await outputAudioContext.resume();
      }
      
      audioContextRef.current = outputAudioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.0-flash-exp',
        callbacks: {
          onopen: () => {
            console.log('Live session opened');
            setIsActive(true);
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              }).catch(() => {});
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            console.log('Received message:', message);
            // Handle Transcriptions
            if (message.serverContent?.outputTranscription) {
              currentTranscriptionRef.current.assistant += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentTranscriptionRef.current.user += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const assistantText = currentTranscriptionRef.current.assistant.trim();
              const userText = currentTranscriptionRef.current.user.trim();
              
              const newEntries: TranscriptionEntry[] = [];
              if (userText) newEntries.push({ role: 'user', text: userText, timestamp: Date.now() });
              if (assistantText) newEntries.push({ role: 'assistant', text: assistantText, timestamp: Date.now() });
              
              if (newEntries.length > 0) {
                transcriptRef.current = [...transcriptRef.current, ...newEntries];
                setTranscript([...transcriptRef.current]);
              }
              
              currentTranscriptionRef.current = { user: '', assistant: '' };
            }

            // Handle Audio
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  const audioData = part.inlineData.data;
                  setIsInterviewerSpeaking(true);
                  const outputCtx = audioContextRef.current!;
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                  
                  const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                  const source = outputCtx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(outputCtx.destination);
                  source.onended = () => {
                    sourcesRef.current.delete(source);
                    if (sourcesRef.current.size === 0) setIsInterviewerSpeaking(false);
                  };
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  sourcesRef.current.add(source);
                }
              }
            }

            if (message.serverContent?.interrupted) {
              for (const s of sourcesRef.current) {
                try { s.stop(); } catch (e) {}
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsInterviewerSpeaking(false);
            }
          },
          onerror: (e: any) => {
            console.error('Session error:', e);
            setError(`Connection error: ${e.message || 'Unknown error'}`);
          },
          onclose: () => {
            console.log('Live session closed');
            setIsActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: {
            parts: [{
              text: `You are an expert technical interviewer. 
              Conduct a professional interview based on the following:
              CV: ${data.cvText}
              Job Description: ${data.jobDescription}
              
              Guidelines:
              1. Be encouraging but professional.
              2. Ask one question at a time.
              3. Wait for the user to finish before asking the next question.
              4. Follow up on user's specific skills mentioned in their CV.
              5. Total interview should be around 5-8 questions.
              6. Start with a brief intro and ask the user to introduce themselves.`
            }]
          }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error('Failed to start session:', err);
      setError(`Failed to initialize: ${err.message || 'Check mic permissions'}`);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }
    for (const s of sourcesRef.current) {
      try { s.stop(); } catch(e) {}
    }
    sourcesRef.current.clear();
    setIsActive(false);
  };

  const handleHangUp = () => {
    stopSession();
    onEnd(transcriptRef.current);
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
      {/* Call Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-slate-300 font-medium">{isActive ? 'Live Interview In Progress' : 'Connecting...'}</span>
        </div>
        <button 
          onClick={handleHangUp}
          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold transition-colors"
        >
          End Interview
        </button>
      </div>

      {/* Main Interaction Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Visualizer & Avatar */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 bg-gradient-to-b from-slate-900 to-slate-800">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${isInterviewerSpeaking ? 'bg-blue-600 border-blue-400 scale-110' : 'bg-slate-700 border-slate-600'}`}>
              <svg className={`w-16 h-16 text-white ${isInterviewerSpeaking ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {isInterviewerSpeaking && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 wave-animation">
                <div className="wave-bar" style={{ animationDelay: '0s' }}></div>
                <div className="wave-bar" style={{ animationDelay: '0.1s' }}></div>
                <div className="wave-bar" style={{ animationDelay: '0.2s' }}></div>
                <div className="wave-bar" style={{ animationDelay: '0.3s' }}></div>
                <div className="wave-bar" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">
            {isInterviewerSpeaking ? 'Interviewer is speaking' : 'Listening...'}
          </p>
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded-lg border border-red-900/30">
              {error}
            </div>
          )}
        </div>

        {/* Real-time Transcript */}
        <div className="w-full md:w-80 bg-slate-950/50 p-4 overflow-y-auto border-l border-slate-800 flex flex-col gap-4">
          <h4 className="text-slate-500 text-xs font-bold uppercase sticky top-0 bg-slate-950/80 py-2">Live Transcript</h4>
          {transcript.length === 0 && !error && (
            <p className="text-slate-600 text-sm italic">Waiting for connection...</p>
          )}
          {transcript.map((entry, i) => (
            <div key={i} className={`flex flex-col ${entry.role === 'user' ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-slate-500 mb-1">{entry.role === 'user' ? 'You' : 'AI Recruiter'}</span>
              <div className={`p-3 rounded-2xl text-xs max-w-[90%] ${entry.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                {entry.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceInterview;
