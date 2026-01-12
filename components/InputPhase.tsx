
import React, { useState, useEffect } from 'react';
import { InterviewData, SavedCV } from '../types';
import { cvStorageService } from '../services/cvStorageService';

interface Props {
  onSubmit: (data: InterviewData) => void;
}

const InputPhase: React.FC<Props> = ({ onSubmit }) => {
  const [subject, setSubject] = useState('');
  const [cvText, setCvText] = useState('');
  const [jdText, setJdText] = useState('');
  const [saveCV, setSaveCV] = useState(false);
  const [cvName, setCvName] = useState('');
  const [selectedCVId, setSelectedCVId] = useState<string>('');
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([]);

  useEffect(() => {
    setSavedCVs(cvStorageService.getAllCVs());
  }, []);

  const handleCVSelect = (cvId: string) => {
    if (cvId === '') {
      setCvText('');
      setSelectedCVId('');
      return;
    }
    const cv = cvStorageService.getCVById(cvId);
    if (cv) {
      setCvText(cv.cvText);
      setSelectedCVId(cvId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cvText.trim() && jdText.trim() && subject.trim()) {
      // Save CV if requested
      if (saveCV && cvName.trim()) {
        cvStorageService.saveCV(cvName, cvText);
      }
      onSubmit({ subject, cvText, jobDescription: jdText });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-2xl font-bold text-slate-800">Setup Your Interview</h2>
        <p className="text-slate-500 mt-1">Provide your details to customize the AI interview experience.</p>
      </div>
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Interview Subject / Job Title</label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
            placeholder="e.g. Senior Frontend Engineer at Google"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">Paste your CV / Resume</label>
              {savedCVs.length > 0 && (
                <select
                  className="text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={selectedCVId}
                  onChange={(e) => handleCVSelect(e.target.value)}
                >
                  <option value="">New CV</option>
                  {savedCVs.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <textarea
              required
              className="w-full h-64 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none text-sm"
              placeholder="Paste the text from your resume here..."
              value={cvText}
              onChange={(e) => {
                setCvText(e.target.value);
                setSelectedCVId('');
              }}
            />
            {!selectedCVId && cvText.trim() && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saveCV"
                  checked={saveCV}
                  onChange={(e) => setSaveCV(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="saveCV" className="text-xs text-slate-600">
                  Save this CV for future use
                </label>
                {saveCV && (
                  <input
                    type="text"
                    placeholder="CV name (e.g., Software Engineer)"
                    value={cvName}
                    onChange={(e) => setCvName(e.target.value)}
                    className="flex-1 text-xs px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Job Description</label>
            <textarea
              required
              className="w-full h-64 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none text-sm"
              placeholder="Paste the job description you are applying for..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
            disabled={!cvText.trim() || !jdText.trim() || !subject.trim()}
          >
            Prepare My Interview
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputPhase;
