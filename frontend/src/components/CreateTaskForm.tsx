'use client';
import React, { useState } from 'react';

interface CreateTaskFormProps {
  onSubmit: (title: string, description: string) => void;
  isLoading: boolean;
}

export default function CreateTaskForm({ onSubmit, isLoading }: CreateTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSubmit(title, description);
    setTitle('');
    setDescription('');
  };

  return (
    <form onSubmit={handleFormSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto mb-10 space-y-4">
      <h3 className="text-sm font-bold text-slate-700 tracking-wide uppercase">⚡ Generate New Intelligent Task</h3>
      
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500">Task Title</label>
        <input
          type="text"
          placeholder="e.g., Implement Biometric Login"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
          className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:opacity-60 transition-all"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500">Description / Requirements</label>
        <textarea
          placeholder="Describe what needs to be built so Gemini can estimate it..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          rows={3}
          className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:opacity-60 transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !title.trim() || !description.trim()}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-semibold py-2.5 rounded-lg shadow-sm transition-colors duration-150 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Gemini is evaluating engineering metrics...
          </>
        ) : (
          'Analyze & Add to Board ✨'
        )}
      </button>
    </form>
  );
}