'use client';
import React, { useState, useEffect } from 'react';

interface CreateTaskFormProps {
  onSubmit: (title: string, description: string) => void;
  isLoading: boolean;
  errorFromServer?: string;
}

export default function CreateTaskForm({ onSubmit, isLoading, errorFromServer }: CreateTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 🔄 Watch for incoming server errors and apply them directly to the display state
  useEffect(() => {
    if (errorFromServer) {
      setErrorMessage(errorFromServer);
    }
  }, [errorFromServer]);

  // 🔄 Clear form inputs automatically once loading stops AND there are no errors (Success case)
  useEffect(() => {
    if (!isLoading && !errorFromServer) {
      setTitle('');
      setDescription('');
    }
  }, [isLoading, errorFromServer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Check for empty or blank spaces
    if (!title.trim() || !description.trim()) {
      setErrorMessage('Please fill out both the task title and description.');
      return;
    }

    // 2. Minimum character count check
    if (description.trim().length < 10) {
      setErrorMessage('Please provide a slightly more descriptive requirements text (at least 10 characters).');
      return;
    }

    // 3. Anti-Gibberish Check
    const gibberishPattern = /(.)\1{3,}/;
    if (gibberishPattern.test(title) || gibberishPattern.test(description)) {
      setErrorMessage('Please enter valid project requirements rather than repeated characters.');
      return;
    }

    // Pass parameters up to page.tsx handler
    onSubmit(title, description);
  };

  return (
    <div className="max-w-3xl mx-auto mb-12 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <h2 className="text-base font-bold text-slate-800 mb-4 tracking-tight">Generate New Intelligent Task</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Task Title</label>
          <input
            type="text"
            placeholder="e.g., Implement JWT Password Reset Flow"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errorMessage) setErrorMessage(''); 
            }}
            disabled={isLoading}
            className="w-full text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Feature Requirements & Details</label>
          <textarea
            placeholder="Describe what needs to be built so the AI can run a reliable architectural metrics analysis..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errorMessage) setErrorMessage(''); 
            }}
            disabled={isLoading}
            rows={3}
            className="w-full text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all resize-none"
          />
        </div>

        {/* ⚠️ Dynamic Validation & AI Rejection Message Box */}
        {errorMessage && (
          <div className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-xl p-3 animate-in fade-in slide-in-from-top-1 duration-200">
            ⚠️ {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 text-xs font-bold tracking-wide uppercase rounded-xl transition-all shadow-sm cursor-pointer ${
            isLoading 
              ? 'bg-slate-100 text-slate-400 cursor-pointer' 
              : 'bg-indigo-950 hover:bg-indigo-700 text-white active:scale-[0.99]'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              AI is Evaluating Architecture...
            </div>
          ) : (
            'Analyze & Generate Task Card'
          )}
        </button>
      </form>
    </div>
  );
}