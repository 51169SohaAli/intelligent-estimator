'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useRouter } from 'next/navigation';
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
  workspace: string;
  assignee?: string;
}

export default function Home() {
  const { user, loading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // UI Control States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Task Drawer State & Edit Form State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRiskLevel, setEditRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [editStoryPoints, setEditStoryPoints] = useState<number>(1);
  const [checkedSubtasks, setCheckedSubtasks] = useState<{ [key: string]: boolean }>({});

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const workspaceId =
    user?.workspaceId ||
    (typeof user?.workspace === 'string' ? user?.workspace : user?.workspace?._id);

  // ==========================================
  // Socket Action Emitters
  // ==========================================
  const onUpdateTask = (taskId: string, updates: Partial<Task>) => {
    if (!socket || !workspaceId) return;
    socket.emit('update-task', { workspaceId, taskId, updates });
  };

  const onAssignTask = (taskId: string, assigneeId: string) => {
    if (!socket || !workspaceId) return;
    socket.emit('assign-task', { workspaceId, taskId, assigneeId });
  };

  const onDeleteTask = (taskId: string) => {
    if (!socket || !workspaceId) return;
    socket.emit('delete-task', { workspaceId, taskId });
  };

  // Redirect unauthorized users
  useEffect(() => {
    if (!loading && !user) {
      router.push('/register');
    }
  }, [user, loading, router]);

  // Join workspace room
  useEffect(() => {
    if (socket && workspaceId) {
      socket.emit('join-workspace', { workspaceId });
    }
  }, [socket, workspaceId]);

  // Fetch initial tasks
  useEffect(() => {
    if (loading || !user || !workspaceId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchTasks = async () => {
      try {
        const response = await fetch(`http://localhost:5000/tasks?workspace=${workspaceId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        }
      } catch (error) {
        console.error('Failed to fetch workspace tasks:', error);
      }
    };

    fetchTasks();
  }, [user, loading, workspaceId]);

  // Unified Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask: Task) => {
      setTasks((prevTasks) => {
        const isDuplicate = prevTasks.some((t) => t._id === newTask._id);
        if (isDuplicate) {
          return prevTasks.map((t) => (t._id === newTask._id ? newTask : t));
        }
        return [newTask, ...prevTasks];
      });
      setIsLoading(false);
      setIsCreateModalOpen(false);
    };

    const handleTaskUpdated = (updatedTask: Task) => {
      setTasks((prev) =>
        prev.map((task) => (task._id === updatedTask._id ? updatedTask : task))
      );
      setSelectedTask((prev) => (prev?._id === updatedTask._id ? updatedTask : prev));
    };

    const handleTaskDeleted = ({ taskId }: { taskId: string }) => {
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      if (selectedTask?._id === taskId) {
        setIsDrawerOpen(false);
        setSelectedTask(null);
      }
    };

    const handleTaskCreatedSuccess = () => {
      setIsLoading(false);
      setIsCreateModalOpen(false);
      setServerError('');
    };

    const handleException = (error: any) => {
      const errorMessage = error?.message || error || 'An error occurred';
      setServerError(errorMessage);
      setIsLoading(false);
    };

    socket.on('task-created', handleTaskCreated);
    socket.on('task-updated', handleTaskUpdated);
    socket.on('task-deleted', handleTaskDeleted);
    socket.on('task-created-success', handleTaskCreatedSuccess);
    socket.on('exception', handleException);

    return () => {
      socket.off('task-created', handleTaskCreated);
      socket.off('task-updated', handleTaskUpdated);
      socket.off('task-deleted', handleTaskDeleted);
      socket.off('task-created-success', handleTaskCreatedSuccess);
      socket.off('exception', handleException);
    };
  }, [socket, selectedTask]);

  const handleCreateTask = async (title: string, description: string) => {
    if (!socket || !workspaceId) return;
    setServerError('');
    setIsLoading(true);
    socket.emit('createTask', {
      title,
      description,
      status: 'Todo',
      workspace: workspaceId,
    });
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

    onUpdateTask(targetTaskId, { status: newStatus });
  };

  const handleCardClick = (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditRiskLevel(task.riskLevel);
    setEditStoryPoints(task.aiStoryPoints);
    setIsEditing(false);
    setIsDrawerOpen(true);
    setCheckedSubtasks({});
  };

  const handleSaveTaskEdits = () => {
    if (!selectedTask) return;

    const updates = {
      title: editTitle,
      description: editDescription,
      riskLevel: editRiskLevel,
      aiStoryPoints: editStoryPoints,
    };

    // Optimistic UI Update
    setSelectedTask({ ...selectedTask, ...updates });
    onUpdateTask(selectedTask._id, updates);
    setIsEditing(false);
  };

  const toggleSubtask = (index: number) => {
    setCheckedSubtasks((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const columns = [
    {
      title: 'To Do',
      status: 'Todo',
      statusDot: 'bg-indigo-400',
      badgeBg: 'bg-indigo-900 text-indigo-200 border-indigo-800',
    },
    {
      title: 'In Progress',
      status: 'InProgress',
      statusDot: 'bg-amber-400',
      badgeBg: 'bg-amber-950/60 text-amber-200 border-amber-900',
    },
    {
      title: 'Done',
      status: 'Done',
      statusDot: 'bg-emerald-400',
      badgeBg: 'bg-emerald-950/60 text-emerald-200 border-emerald-900',
    },
  ];

  if (loading || !hasMounted || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans font-bold text-xs text-slate-400 tracking-wider uppercase">
        Authenticating session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased overflow-x-hidden text-slate-800">
      <Sidebar isCollapsed={isSidebarCollapsed} />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />

        <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {hasMounted && (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                {columns.map((col) => {
                  const filteredTasks = tasks.filter((t) => t.status === col.status);

                  return (
                    <Droppable droppableId={col.status} key={col.status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`rounded-2xl border border-slate-200/80 flex flex-col min-h-[70vh] transition-all bg-slate-100/60 overflow-hidden shadow-sm ${
                            snapshot.isDraggingOver ? 'bg-slate-200/60 scale-[1.01]' : ''
                          }`}
                        >
                          <div className="bg-indigo-950 px-4 py-3.5 flex items-center justify-between border-b border-indigo-900 shadow-xs">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${col.statusDot}`} />
                              <h3 className="text-xs font-black tracking-wider text-white uppercase">
                                {col.title}
                              </h3>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${col.badgeBg}`}>
                              {filteredTasks.length}
                            </span>
                          </div>

                          <div className="p-3 space-y-4 overflow-y-auto max-h-[75vh] flex-1">
                            {filteredTasks.map((task, index) => (
                              <Draggable key={task._id} draggableId={task._id} index={index}>
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    onClick={() => handleCardClick(task)}
                                    className={`transition-all ${
                                      dragSnapshot.isDragging ? 'z-50' : ''
                                    }`}
                                  >
                                    <TaskCard task={task} />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            {filteredTasks.length === 0 && (
                              <div className="text-center py-16 border border-dashed border-slate-200/80 rounded-xl text-slate-400 text-xs font-medium bg-white/40">
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
          )}
        </main>
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsCreateModalOpen(false)} />
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">Create New Agile Task</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg p-1.5 text-xs font-bold w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <div className="p-6">
              <CreateTaskForm onSubmit={handleCreateTask} isLoading={isLoading} errorFromServer={serverError} />
            </div>
          </div>
        </div>
      )}

      {/* Task Details & Edit Drawer */}
      {isDrawerOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsDrawerOpen(false)} />
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-wrap items-center gap-2">
                {!isEditing ? (
                  <>
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
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <select
                      value={editRiskLevel}
                      onChange={(e) => setEditRiskLevel(e.target.value as 'Low' | 'Medium' | 'High')}
                      className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1"
                    >
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={editStoryPoints}
                      onChange={(e) => setEditStoryPoints(Number(e.target.value))}
                      className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 w-20"
                      placeholder="Points"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 transition-all"
                  >
                    Edit Details
                  </button>
                ) : (
                  <button
                    onClick={handleSaveTaskEdits}
                    className="text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-all"
                  >
                    Save Changes
                  </button>
                )}
                <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg p-1.5 text-sm font-bold w-8 h-8 flex items-center justify-center">✕</button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {!isEditing ? (
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">{selectedTask.title}</h2>
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/40">{selectedTask.description}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-base font-semibold border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Description</label>
                    <textarea
                      rows={4}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Subtasks Checklist */}
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

            {/* Drawer Footer / Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500">Assignee:</label>
                <select
                  value={selectedTask.assignee || ''}
                  onChange={(e) => {
                    const assigneeId = e.target.value;
                    setSelectedTask({ ...selectedTask, assignee: assigneeId });
                    onAssignTask(selectedTask._id, assigneeId);
                  }}
                  className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Unassigned</option>
                  <option value={user.id}>{user.name} (You)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDeleteTask(selectedTask._id)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition-all"
                >
                  Delete Task
                </button>
                <button onClick={() => setIsDrawerOpen(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm">
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}