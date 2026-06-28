'use client';
import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import TaskCard from '../components/TaskCard';
import CreateTaskForm from '../components/CreateTaskForm';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'Todo' | 'InProgress' | 'Done';
  aiStoryPoints: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  aiSubTasks: string[];
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // 👇 1. Added state managers for our Subtask Drawer
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [checkedSubtasks, setCheckedSubtasks] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const socketInstance = io('http://localhost:5000');
    setSocket(socketInstance);

    socketInstance.on('taskCreated', (newTask: Task) => {
      setTasks((prevTasks) => [newTask, ...prevTasks]);
      setIsLoading(false);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleCreateTask = async (title: string, description: string) => {
    if (!socket) return;
    
    setIsLoading(true);
    console.log('🚀 Frontend emitting "createTask" event with data:', { title, description });
    
    socket.emit('createTask', {
      title,
      description,
      status: 'Todo'
    });
  };

  // 👇 2. Helper to open the drawer when a card is clicked
  const handleCardClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
    // Reset checked items for the new task board
    setCheckedSubtasks({});
  };

  // 👇 3. Helper to toggle a subtask checkbox item
  const toggleSubtask = (index: number) => {
    setCheckedSubtasks((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const columns = [
    { title: 'To Do', status: 'Todo', headerBg: 'bg-indigo-500' },
    { title: 'In Progress', status: 'InProgress', headerBg: 'bg-amber-500' },
    { title: 'Done', status: 'Done', headerBg: 'bg-emerald-500' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-8 relative overflow-x-hidden">
      <header className="max-w-7xl mx-auto mb-10 text-center md:text-left">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Intelligent Agile Dashboard</h1>
        <p className="text-slate-500 text-sm">Real-time AI task forecasting engine</p>
      </header>

      <CreateTaskForm onSubmit={handleCreateTask} isLoading={isLoading} />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((col) => {
          const filteredTasks = tasks.filter((t) => t.status === col.status);
          
          return (
            <div key={col.status} className="bg-slate-100 rounded-2xl p-4 border border-slate-200/60 flex flex-col min-h-[500px]">
              <div className="flex items-center gap-2 mb-4 px-1">
                <span className={`w-2.5 h-2.5 rounded-full ${col.headerBg}`} />
                <h3 className="font-bold text-slate-700 text-sm tracking-wide uppercase">{col.title}</h3>
                <span className="ml-auto bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-md">
                  {filteredTasks.length}
                </span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
                {filteredTasks.map((task) => (
                  <div 
                    key={task._id} 
                    onClick={() => handleCardClick(task)} 
                    className="cursor-pointer transition transform hover:-translate-y-0.5 active:scale-95"
                  >
                    {/* 👇 Added onClick wrap here to intercept card selections */}
                    <TaskCard task={task} />
                  </div>
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

     {/* ==================== 🛠️ CENTERED POP-UP MODAL COMPONENT ==================== */}
      {isDrawerOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          
          {/* 1. Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* 2. Main Centered Modal Card Box */}
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg uppercase ${
                  selectedTask.riskLevel === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                  selectedTask.riskLevel === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                  'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  {selectedTask.riskLevel} Risk
                </span>
                <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-lg border border-indigo-100">
                  {selectedTask.aiStoryPoints} Story Points
                </span>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg p-1.5 transition-colors text-sm font-bold w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Content Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">{selectedTask.title}</h2>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/40">
                  {selectedTask.description}
                </p>
              </div>

              {/* Technical Subtasks Checklist */}
              <div>
                <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3">
                  AI Engineering Checklist ({selectedTask.aiSubTasks?.length || 0})
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedTask.aiSubTasks?.map((subtask, index) => (
                    <label 
                      key={index}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                        checkedSubtasks[index] 
                          ? 'bg-slate-50/80 border-slate-200/60 opacity-60' 
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={!!checkedSubtasks[index]}
                        onChange={() => toggleSubtask(index)}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 transition-colors"
                      />
                      <span className={`text-sm text-slate-700 leading-tight ${checkedSubtasks[index] ? 'line-through text-slate-400' : 'font-medium'}`}>
                        {subtask}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}
      </main>
  );
}