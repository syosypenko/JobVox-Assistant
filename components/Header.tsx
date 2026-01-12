
import React from 'react';
import { SyncStatus } from '../types';

interface Props {
  onHistoryClick: () => void;
  syncStatus: SyncStatus;
  onDBIconClick: () => void;
}

const Header: React.FC<Props> = ({ onHistoryClick, syncStatus, onDBIconClick }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onHistoryClick}>
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-blue-200 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">JobVox <span className="text-blue-600">Assistant</span></h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div 
            onClick={onDBIconClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-green-500' : syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {syncStatus === 'synced' ? 'Postgres Active' : syncStatus === 'syncing' ? 'Syncing...' : 'DB Error'}
            </span>
          </div>

          <nav className="flex items-center gap-4 text-sm font-medium text-slate-600 border-l border-slate-100 pl-4 sm:pl-6">
            <button onClick={onHistoryClick} className="hover:text-blue-600 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
