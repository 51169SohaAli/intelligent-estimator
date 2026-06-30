'use client';
import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import TaskCard from '../components/TaskCard';
import CreateTaskForm from '../components/CreateTaskForm';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

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

  // UI Control States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // 🔑 Added state for creation modal

  // Task Viewer Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [checkedSubtasks, setCheckedSubtasks] = useState<{ [key: string]: boolean }>({});

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
      setIsCreateModalOpen(false); // 🔑 Automatically close modal on successful task creation
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
    { title: 'To Do', status: 'Todo', headerBg: 'bg-indigo-500' },
    { title: 'In Progress', status: 'InProgress', headerBg: 'bg-amber-500' },
    { title: 'Done', status: 'Done', headerBg: 'bg-emerald-500' },
  ];

  if (!hasMounted) return null;
  
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased overflow-x-hidden text-slate-800">
      
      <Sidebar isCollapsed={isSidebarCollapsed} />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        
        {/* 🌅 Passed both props to handle menu toggles and opening the creation modal */}
        <Header 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          onOpenCreateModal={() => setIsCreateModalOpen(true)} 
        />

        <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-8">
          
          {/* 💡 Note: CreateTaskForm was completely removed from here to clean up the canvas layout view! */}

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {columns.map((col) => {
                const filteredTasks = tasks.filter((t) => t.status === col.status);
                
                return (
                  <Droppable droppableId={col.status} key={col.status}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`rounded-2xl p-4 border flex flex-col min-h-[500px] transition-colors ${
                          snapshot.isDraggingOver ? 'bg-slate-200/70 border-slate-300' : 'bg-slate-100 border-slate-200/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-4 px-1">
                          <span className={`w-2.5 h-2.5 rounded-full ${col.headerBg}`} />
                          <h3 className="font-bold text-slate-700 text-sm tracking-wide uppercase">{col.title}</h3>
                          <span className="ml-auto bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-md">
                            {filteredTasks.length}
                          </span>
                        </div>

                        <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1 flex-1">
                          {filteredTasks.map((task, index) => (
                            <Draggable key={task._id} draggableId={task._id} index={index}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  onClick={() => handleCardClick(task)} 
                                  className={`transition transform active:scale-95 ${
                                    dragSnapshot.isDragging ? 'shadow-xl rotate-1 z-50' : 'hover:-translate-y-0.5'
                                  }`}
                                >
                                  <TaskCard task={task} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {filteredTasks.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                              No tasks here yet
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

      {/* ==================== ➕ NEW CENTERED FLOATING CREATION MODAL ==================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsCreateModalOpen(false)} />
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">Create New Agile Task</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg p-1.5 text-xs font-bold w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <div className="p-6">
              <CreateTaskForm onSubmit={handleCreateTask} isLoading={isLoading} errorFromServer={serverError}/>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CENTERED POP-UP DETAILS DRAWER ==================== */}
      {isDrawerOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsDrawerOpen(false)} />
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
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
              <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg p-1.5 text-sm font-bold w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">{selectedTask.title}</h2>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/40">{selectedTask.description}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3">AI Engineering Checklist ({selectedTask.aiSubTasks?.length || 0})</h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedTask.aiSubTasks?.map((subtask, index) => (
                    <label key={index} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${checkedSubtasks[index] ? 'bg-slate-50/80 border-slate-200/60 opacity-60' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow'}`}>
                      <input type="checkbox" checked={!!checkedSubtasks[index]} onChange={() => toggleSubtask(index)} className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                      <span className={`text-sm text-slate-700 leading-tight ${checkedSubtasks[index] ? 'line-through text-slate-400' : 'font-medium'}`}>{subtask}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsDrawerOpen(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm">Close View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}