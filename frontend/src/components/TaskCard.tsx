import React from 'react';

interface TaskCardProps {
  task: {
    title: string;
    description: string;
    aiStoryPoints: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    aiSubTasks: string[];
  };
}

export default function TaskCard({ task }: TaskCardProps) {
  // Dynamic color badge for risk levels
  const riskColors = {
    Low: 'bg-green-100 text-green-800 border-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    High: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200 space-y-4 cursor-pointer">
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-semibold text-slate-800 text-base">{task.title}</h4>
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200 whitespace-nowrap">
          {task.aiStoryPoints} SP
        </span>
      </div>
      
      <p className="text-slate-600 text-xs line-clamp-2">{task.description}</p>
      
      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${riskColors[task.riskLevel]}`}>
          {task.riskLevel} Risk
        </span>
        <span className="text-xs text-slate-400 font-medium">
          📋 {task.aiSubTasks?.length || 0} Subtasks
        </span>
      </div>
    </div>
  );
}