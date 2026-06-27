'use client';
import React, { useState } from 'react';
// Using ../ steps out of the app/ folder into the src/ folder directly
import TaskCard from '../components/TaskCard';

// Dummy data mirroring your exact NestJS database structure
const initialTasks = [
  {
    _id: '1',
    title: 'User Authentication System',
    description: 'Implement a secure JWT-based login and signup system for users using bcrypt for password hashing.',
    status: 'Todo',
    aiStoryPoints: 8,
    riskLevel: 'Medium' as const,
    aiSubTasks: ['Setup NestJS project', 'Define User Schema', 'Create JWT Strategy'],
  },
  {
    _id: '2',
    title: 'Setup MongoDB Deployment',
    description: 'Configure cluster on MongoDB Atlas and set up secure environment connection string.',
    status: 'Done',
    aiStoryPoints: 2,
    riskLevel: 'Low' as const,
    aiSubTasks: ['Create Atlas cluster', 'Whitelist IP address'],
  }
];

export default function Home() {
  const [tasks] = useState(initialTasks);

  const columns = [
    { title: 'To Do', status: 'Todo', headerBg: 'bg-indigo-500' },
    { title: 'In Progress', status: 'InProgress', headerBg: 'bg-amber-500' },
    { title: 'Done', status: 'Done', headerBg: 'bg-emerald-500' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      {/* Top Navigation / Header */}
      <header className="max-w-7xl mx-auto mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Intelligent Agile Dashboard</h1>
          <p className="text-slate-500 text-sm">Real-time AI task forecasting engine</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors duration-150">
          + Create New Task
        </button>
      </header>

      {/* The 3-Column Kanban Board Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((col) => {
          const filteredTasks = tasks.filter((t) => t.status === col.status);
          
          return (
            <div key={col.status} className="bg-slate-100 rounded-2xl p-4 border border-slate-200/60 flex flex-col min-h-[500px]">
              {/* Column Title Indicator */}
              <div className="flex items-center gap-2 mb-4 px-1">
                <span className={`w-2.5 h-2.5 rounded-full ${col.headerBg}`} />
                <h3 className="font-bold text-slate-700 text-sm tracking-wide uppercase">{col.title}</h3>
                <span className="ml-auto bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-md">
                  {filteredTasks.length}
                </span>
              </div>

              {/* Task Cards Container */}
              <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
                {filteredTasks.map((task) => (
                  <TaskCard key={task._id} task={task} />
                ))}
                {filteredTasks.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                    No tasks here yet
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}