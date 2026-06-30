'use client';
import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
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
  const [serverError, setServerError] = useState('');

  // Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [checkedSubtasks, setCheckedSubtasks] = useState<{ [key: string]: boolean }>({});

  // Next.js Server-to-Client synchronization guard
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    const fetchTasks = async () => {
      try {
        const response = await fetch('http://localhost:5000/tasks');
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        }
      } catch (error) {
        console.error('❌ Failed to fetch initial tasks from database:', error);
      }
    };
    
    fetchTasks();

    const socketInstance = io('http://localhost:5000');
    setSocket(socketInstance);

    socketInstance.on('taskCreated', (newTask: Task) => {
      setTasks((prevTasks) => [newTask, ...prevTasks]);
      setIsLoading(false);
      setServerError(''); 
    });

    socketInstance.on('exception', (error: any) => {
      console.log("❌ Received error from server:", error);
      const errorMessage = error?.message || error || "An error occurred";
      setServerError(errorMessage);
      setIsLoading(false); 
    });

    socketInstance.on('taskStatusUpdated', (updatedTask: Task) => {
      setTasks((prevTasks) => 
        prevTasks.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleCreateTask = async (title: string, description: string) => {
    if (!socket) return;
    setServerError(''); 
    setIsLoading(true);
    socket.emit('createTask', { title, description, status: 'Todo' });
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    const targetTaskId = draggableId;
    const newStatus = destination.droppableId as 'Todo' | 'InProgress' | 'Done';

    setTasks((prevTasks) =>
      prevTasks.map((t) => (t._id === targetTaskId ? { ...t, status: newStatus } : t))
    );

    if (socket) {
      socket.emit('updateTaskStatus', {
        id: targetTaskId,
        status: newStatus,
      });
    }
  };

  const handleCardClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
    setCheckedSubtasks({});
  };

  const toggleSubtask = (index: number) => {
    setCheckedSubtasks((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const columns = [
    { title: 'To Do', status: 'Todo', headerBg: 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]' },
    { title: 'In Progress', status: 'InProgress', headerBg: 'bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.5)]' },
    { title: 'Done', status: 'Done', headerBg: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' },
  ];

  if (!hasMounted) return null;

  return (
    // 🌌 Deep dark purple cosmic background gradient
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 flex font-sans text-slate-100 antialiased overflow-x-hidden">
      
      {/* 🔮 SIDEBAR - Glassmorphism style */}
      <aside className="w-64 bg-purple-950/20 backdrop-blur-xl border-r border-purple-500/15 p-6 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Logo Branding */}
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-fuchsia-400 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              ✨
            </div>
            <div>
              <h2 className="font-bold tracking-tight bg-gradient-to-r from-white via-purple-200 to-fuchsia-300 bg-clip-text text-transparent">AuraEstimator</h2>
              <p className="text-[10px] text-purple-400/70 font-medium tracking-wider uppercase">Agile Suite</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 font-medium text-sm shadow-inner transition-all">
              <span>📊</span> Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-purple-300/60 hover:text-purple-200 hover:bg-purple-500/5 border border-transparent hover:border-purple-500/10 font-medium text-sm transition-all">
              <span>⚙️</span> Workspace Settings
            </a>
          </nav>
        </div>

        {/* User Footer Account Profile stub */}
        <div className="flex items-center gap-3 p-2 bg-purple-500/5 border border-purple-500/10 rounded-2xl backdrop-blur-sm">
          <div className="w-9 h-9 rounded-xl bg-purple-600 border border-purple-400/30 flex items-center justify-center text-sm font-semibold shadow-inner">
            SA
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-purple-200 truncate">Soha Ali</h4>
            <p className="text-[10px] text-purple-400/60 truncate">Developer Account</p>
          </div>
        </div>
      </aside>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* 🌅 TOP HEADER - Glassmorphism style */}
        <header className="h-16 bg-purple-950/10 backdrop-blur-md border-b border-purple-500/15 px-8 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold tracking-tight text-purple-100">Intelligent Agile Dashboard</h1>
            <p className="text-[10px] text-purple-400/70">Real-time AI task forecasting engine</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span className="text-xs font-semibold text-purple-300/70 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
              Live Connection Sync
            </span>
          </div>
        </header>

        {/* 🛠️ SCROLLABLE BOARD DASHBOARD AREA */}
        <main className="flex-1 p-8 overflow-y-auto max-w-[1600px] w-full mx-auto space-y-8">
          
          {/* Form wrapper */}
          <div className="bg-purple-950/20 backdrop-blur-xl border border-purple-500/15 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
            <CreateTaskForm onSubmit={handleCreateTask} isLoading={isLoading} errorFromServer={serverError}/>
          </div>

          {/* Kanban Layout */}
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {columns.map((col) => {
                const filteredTasks = tasks.filter((t) => t.status === col.status);
                
                return (
                  <Droppable droppableId={col.status} key={col.status}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`rounded-3xl p-5 border flex flex-col min-h-[550px] transition-all relative overflow-hidden backdrop-blur-xl shadow-xl ${
                          snapshot.isDraggingOver 
                            ? 'bg-purple-900/30 border-purple-500/40 shadow-purple-500/5' 
                            : 'bg-purple-950/15 border-purple-500/10'
                        }`}
                      >
                        {/* Decorative inner column shine */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/20 to-transparent" />

                        {/* Column Header */}
                        <div className="flex items-center gap-2.5 mb-5 px-1">
                          <span className={`w-2.5 h-2.5 rounded-full ${col.headerBg}`} />
                          <h3 className="font-bold text-purple-200/90 text-xs tracking-wider uppercase">{col.title}</h3>
                          <span className="ml-auto bg-purple-500/15 border border-purple-500/20 text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-lg shadow-inner">
                            {filteredTasks.length}
                          </span>
                        </div>

                        {/* Task Stack Stack area */}
                        <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1 flex-1 custom-scrollbar">
                          {filteredTasks.map((task, index) => (
                            <Draggable key={task._id} draggableId={task._id} index={index}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  onClick={() => handleCardClick(task)} 
                                  className={`transition-all duration-200 transform rounded-2xl ${
                                    dragSnapshot.isDragging 
                                      ? 'shadow-[0_20px_30px_rgba(0,0,0,0.5)] rotate-2 z-50 scale-102 border-purple-400/50 bg-purple-900/40' 
                                      : 'hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/5'
                                  }`}
                                >
                                  <TaskCard task={task} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          
                          {filteredTasks.length === 0 && (
                            <div className="text-center py-16 border border-dashed border-purple-500/20 rounded-2xl text-purple-400/40 text-xs font-medium backdrop-blur-xs">
                              ✨ Empty Column
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </DragDropContext>
        </main>
      </div>

      {/* ==================== CENTERED MODAL VIEW ==================== */}
      {isDrawerOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Glassy backdrop layer */}
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={() => setIsDrawerOpen(false)} />
          
          <div className="bg-slate-900/90 border border-purple-500/20 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 relative">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-purple-500/10 bg-purple-950/30">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${
                  selectedTask.riskLevel === 'High' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                  selectedTask.riskLevel === 'Medium' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 
                  'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {selectedTask.riskLevel} Risk
                </span>
                <span className="bg-purple-500/15 text-purple-300 text-[10px] font-bold px-3 py-1 rounded-lg border border-purple-500/30 tracking-wider uppercase">
                  {selectedTask.aiStoryPoints} Story Points
                </span>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="text-purple-300/60 hover:text-white hover:bg-purple-500/15 rounded-xl w-8 h-8 flex items-center justify-center font-bold text-xs transition-all">✕</button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h2 className="text-lg font-bold text-purple-50 tracking-tight">{selectedTask.title}</h2>
                <p className="mt-3 text-sm text-purple-200/70 leading-relaxed bg-purple-950/40 p-4 rounded-2xl border border-purple-500/10 shadow-inner">{selectedTask.description}</p>
              </div>
              
              <div>
                <h4 className="text-[10px] font-bold tracking-widest text-purple-400/70 uppercase mb-3">AI Engineering Checklist ({selectedTask.aiSubTasks?.length || 0})</h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {selectedTask.aiSubTasks?.map((subtask, index) => (
                    <label key={index} className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer select-none ${checkedSubtasks[index] ? 'bg-purple-950/20 border-purple-500/10 opacity-40 shadow-none' : 'bg-purple-950/40 border-purple-500/15 hover:border-purple-400/30 shadow-md'}`}>
                      <input type="checkbox" checked={!!checkedSubtasks[index]} onChange={() => toggleSubtask(index)} className="mt-0.5 rounded border-purple-500/30 text-purple-500 focus:ring-purple-500 bg-purple-950/60 w-4 h-4" />
                      <span className={`text-sm text-purple-100 leading-tight ${checkedSubtasks[index] ? 'line-through text-purple-400/50' : 'font-medium'}`}>{subtask}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-purple-950/20 border-t border-purple-500/10 flex justify-end">
              <button onClick={() => setIsDrawerOpen(false)} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">Close View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}