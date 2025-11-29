"use client";

import { KanbanCard } from "@/components/ui/kanban-card";
import { Filter, List, Plus, AlertCircle, Clock, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import tasksData from "@/data/tasks.json";

type TaskStatus = "todo" | "inProgress" | "completed";

type BadgeVariant = "default" | "primary" | "secondary" | "success" | "warning" | "danger";

interface Task {
  id: string;
  status: TaskStatus;
  image?: string;
  badges: Array<{ label: string; variant: BadgeVariant }>;
  title: string;
  description?: string;
  assignees: Array<{ name: string; avatar: string }>;
  attachments: number;
  comments: number;
  priority?: "low" | "medium" | "high";
  createdAt: Date;
  dueDate?: Date;
}

// Load tasks from JSON and convert date fields
const INITIAL_TASKS: Task[] = tasksData.tasks.map((task: any) => ({
  ...task,
  createdAt: new Date(Date.now() - task.createdAtDaysAgo * 24 * 60 * 60 * 1000),
  dueDate: task.dueDateDaysFromNow !== undefined
    ? new Date(Date.now() + task.dueDateDaysFromNow * 24 * 60 * 60 * 1000)
    : undefined,
}));

function SortableCard({ task, isOverlay = false }: { task: Task; isOverlay?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isOverlay) {
    return (
      <div>
        <KanbanCard
          image={task.image}
          badges={task.badges}
          title={task.title}
          description={task.description}
          assignees={task.assignees}
          attachments={task.attachments}
          comments={task.comments}
        />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative">
      {isOver && (
        <div className="absolute -top-2 left-0 right-0 h-1 bg-blue-400 rounded-full z-10 animate-pulse" />
      )}
      <div className={`transition-all duration-200 ${isOver ? 'mt-8' : 'mt-0'}`}>
        <KanbanCard
          image={task.image}
          badges={task.badges}
          title={task.title}
          description={task.description}
          assignees={task.assignees}
          attachments={task.attachments}
          comments={task.comments}
        />
      </div>
    </div>
  );
}

function DroppableColumn({
  id,
  children,
  title,
  count,
  badgeColor,
  isEmpty,
}: {
  id: string;
  children: React.ReactNode;
  title: string;
  count: number;
  badgeColor: string;
  isEmpty: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-lg">{title}</h2>
          <span className={`${badgeColor} text-white text-xs font-medium px-2.5 py-0.5 rounded-full`}>
            {count}
          </span>
        </div>
        <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className={`min-h-[200px] p-3 rounded-lg border-2 transition-all duration-200 ${isOver && isEmpty
          ? 'border-blue-300 border-dashed bg-blue-50'
          : 'border-transparent'
        }`}>
        <div className="space-y-4">
          {children}
          {isOver && !isEmpty && (
            <div className="h-1 bg-blue-400 rounded-full animate-pulse mt-4" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-80 mb-6"></div>

            {/* Navigation Tabs Skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex gap-8 border-b border-gray-200">
                <div className="pb-3 h-6 bg-gray-200 rounded w-20"></div>
                <div className="pb-3 h-6 bg-gray-200 rounded w-16"></div>
                <div className="pb-3 h-6 bg-gray-200 rounded w-20"></div>
                <div className="pb-3 h-6 bg-gray-200 rounded w-20"></div>
                <div className="pb-3 h-6 bg-gray-200 rounded w-12"></div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 bg-gray-200 rounded-lg w-20"></div>
                <div className="h-9 bg-gray-200 rounded-lg w-16"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board Skeleton */}
        <div className="p-8">
          <div className="flex gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 min-w-0">
                <div className="animate-pulse">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-7 bg-gray-200 rounded w-24"></div>
                    <div className="h-6 w-8 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="space-y-4">
                    {[1, 2].map((j) => (
                      <div key={j} className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                        <div className="h-5 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/5 mb-4"></div>
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-4 bg-gray-200 rounded w-8"></div>
                            <div className="h-4 bg-gray-200 rounded w-8"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) {
      setActiveId(null);
      return;
    }

    let newStatus: TaskStatus | null = null;
    if (overId === "todo" || overId === "inProgress" || overId === "completed") {
      newStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (newStatus && activeTask.status !== newStatus) {
      setTasks((tasks) =>
        tasks.map((task) =>
          task.id === activeId ? { ...task, status: newStatus as TaskStatus } : task
        )
      );
    }

    setActiveId(null);
  };

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "inProgress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const activeTask = tasks.find((t) => t.id === activeId);

  // Statistics calculations
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Status data for pie chart
  const statusData = [
    { name: "To Do", value: todoTasks.length, color: "#a855f7" },
    { name: "In Progress", value: inProgressTasks.length, color: "#ec4899" },
    { name: "Completed", value: completedTasks.length, color: "#c084fc" },
  ];

  // Priority data for bar chart
  const priorityCounts = {
    high: tasks.filter((t) => t.priority === "high").length,
    medium: tasks.filter((t) => t.priority === "medium").length,
    low: tasks.filter((t) => t.priority === "low").length,
  };

  const priorityData = [
    { name: "High", count: priorityCounts.high, fill: "#ef4444" },
    { name: "Medium", count: priorityCounts.medium, fill: "#f59e0b" },
    { name: "Low", count: priorityCounts.low, fill: "#10b981" },
  ];

  // Recent tasks (최근 5개)
  const recentTasks = [...tasks]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  // Upcoming deadlines (7일 이내, 최대 5개)
  const now = Date.now();
  const sevenDaysLater = now + 7 * 24 * 60 * 60 * 1000;
  const upcomingDeadlines = tasks
    .filter((t) => t.dueDate && t.dueDate.getTime() > now && t.dueDate.getTime() <= sevenDaysLater && t.status !== "completed")
    .sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0))
    .slice(0, 5);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="text-sm text-gray-500 mb-2">Project / Litmers / Board</div>
          <h1 className="text-4xl font-bold mb-6">Litmers AI Issue Tracker</h1>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between">
            <nav className="flex gap-8 border-b border-gray-200">
              <button className="pb-3 text-gray-500 hover:text-gray-900">Overview</button>
              <button className="pb-3 text-gray-900 border-b-2 border-gray-900 font-medium">Boards</button>
              <button className="pb-3 text-gray-500 hover:text-gray-900">Timeline</button>
              <button className="pb-3 text-gray-500 hover:text-gray-900">Activities</button>
              <button className="pb-3 text-gray-500 hover:text-gray-900">Files</button>
            </nav>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <List className="w-4 h-4" />
                <span>Sort</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="p-8 space-y-6">
          {/* Stats Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Tasks */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Tasks</p>
                  <p className="text-3xl font-bold">{totalTasks}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Completion Rate</p>
                  <p className="text-3xl font-bold">{completionRate}%</p>
                  <p className="text-xs text-gray-400 mt-1">{completedTasks.length} / {totalTasks}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">In Progress</p>
                  <p className="text-3xl font-bold">{inProgressTasks.length}</p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Due in 7 Days</p>
                  <p className="text-3xl font-bold">{upcomingDeadlines.length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Distribution - Pie Chart */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Distribution - Bar Chart */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Priority Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priorityData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {priorityData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Issues */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Recent Issues</h3>
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div key={task.id} className="pb-3 border-b border-gray-100 last:border-b-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        task.priority === "high" ? "bg-red-100 text-red-700" :
                        task.priority === "medium" ? "bg-orange-100 text-orange-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Upcoming Deadlines (Next 7 Days)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingDeadlines.map((task) => {
                  const daysLeft = task.dueDate
                    ? Math.ceil((task.dueDate.getTime() - now) / (24 * 60 * 60 * 1000))
                    : 0;
                  return (
                    <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                      <p className="font-medium text-gray-900 truncate mb-2">{task.title}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded ${
                          daysLeft <= 2 ? "bg-red-100 text-red-700" :
                          daysLeft <= 5 ? "bg-orange-100 text-orange-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                        </span>
                        <span className="text-xs text-gray-500">
                          {task.dueDate?.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Kanban Board */}
        <div className="px-8 pb-8">
          <div className="flex gap-6">
            {/* TO DO Column */}
            <SortableContext items={todoTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <DroppableColumn
                id="todo"
                title="TO DO"
                count={todoTasks.length}
                badgeColor="bg-purple-500"
                isEmpty={todoTasks.length === 0}
              >
                {todoTasks.map((task) => (
                  <SortableCard key={task.id} task={task} />
                ))}
              </DroppableColumn>
            </SortableContext>

            {/* IN PROGRESS Column */}
            <SortableContext items={inProgressTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <DroppableColumn
                id="inProgress"
                title="IN PROGRESS"
                count={inProgressTasks.length}
                badgeColor="bg-pink-500"
                isEmpty={inProgressTasks.length === 0}
              >
                {inProgressTasks.map((task) => (
                  <SortableCard key={task.id} task={task} />
                ))}
              </DroppableColumn>
            </SortableContext>

            {/* COMPLETED Column */}
            <SortableContext items={completedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <DroppableColumn
                id="completed"
                title="COMPLETED"
                count={completedTasks.length}
                badgeColor="bg-purple-400"
                isEmpty={completedTasks.length === 0}
              >
                {completedTasks.map((task) => (
                  <SortableCard key={task.id} task={task} />
                ))}
              </DroppableColumn>
            </SortableContext>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="flex-1">
            <KanbanCard
              image={activeTask.image}
              badges={activeTask.badges}
              title={activeTask.title}
              description={activeTask.description}
              assignees={activeTask.assignees}
              attachments={activeTask.attachments}
              comments={activeTask.comments}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
