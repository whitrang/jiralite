"use client";

import { KanbanCard } from "@/components/ui/kanban-card";
import { Filter, List, Plus } from "lucide-react";
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
}

const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    status: "todo",
    badges: [{ label: "Design System", variant: "warning" }],
    title: "Carnesia Mobile App",
    description: "One-stop authentic shop for Beauty, Makeup, Skin Care & Accessories",
    assignees: [
      { name: "User 4", avatar: "https://i.pravatar.cc/150?img=4" }
    ],
    attachments: 2,
    comments: 19
  },

  {
    id: "task-2",
    status: "todo",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop",
    badges: [
      { label: "High", variant: "default" },
      { label: "Mobile", variant: "secondary" }
    ],
    title: "Hosting Mobile Apps",
    description: "Task management has never looked more streamlined—and beautiful.",
    assignees: [
      { name: "User 1", avatar: "https://i.pravatar.cc/150?img=1" },
      { name: "User 2", avatar: "https://i.pravatar.cc/150?img=2" },
      { name: "User 3", avatar: "https://i.prava2tar.cc/150?img=3" }
    ],
    attachments: 1,
    comments: 10
  },
  {
    id: "task-3",
    status: "inProgress",
    badges: [{ label: "Design System", variant: "warning" }],
    title: "Implement Userflow and Navigation",
    assignees: [
      { name: "User 5", avatar: "https://i.pravatar.cc/150?img=5" },
      { name: "User 6", avatar: "https://i.pravatar.cc/150?img=6" },
      { name: "User 7", avatar: "https://i.pravatar.cc/150?img=7" }
    ],
    attachments: 7,
    comments: 12
  },
  {
    id: "task-4",
    status: "inProgress",
    badges: [{ label: "Copywriting", variant: "default" }],
    title: "Copy Onboarding Screens",
    description: "It uses a limited palette with color accents, atmospheric hero image",
    assignees: [
      { name: "User 8", avatar: "https://i.pravatar.cc/150?img=8" },
      { name: "User 9", avatar: "https://i.pravatar.cc/150?img=9" }
    ],
    attachments: 2,
    comments: 15
  },
  {
    id: "task-5",
    status: "inProgress",
    badges: [{ label: "Moodboard", variant: "secondary" }],
    title: "Admin Dashboard",
    description: "This convenient shortcut for manage tasks some server information",
    assignees: [
      { name: "User 10", avatar: "https://i.pravatar.cc/150?img=10" },
      { name: "User 11", avatar: "https://i.pravatar.cc/150?img=11" },
      { name: "User 12", avatar: "https://i.pravatar.cc/150?img=12" }
    ],
    attachments: 5,
    comments: 32
  },
  {
    id: "task-6",
    status: "completed",
    badges: [{ label: "Wireframe", variant: "default" }],
    title: "Test Checkout Process",
    description: "Test the new checkout automation wireframes with the recruiters",
    assignees: [
      { name: "User 13", avatar: "https://i.pravatar.cc/150?img=13" },
      { name: "User 14", avatar: "https://i.pravatar.cc/150?img=14" }
    ],
    attachments: 1,
    comments: 10
  },
  {
    id: "task-7",
    status: "completed",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    badges: [
      { label: "Low", variant: "danger" },
      { label: "UI Design", variant: "secondary" }
    ],
    title: "Website Design",
    description: "typography with prominent catchy tagline instantly informing",
    assignees: [
      { name: "User 15", avatar: "https://i.pravatar.cc/150?img=15" },
      { name: "User 16", avatar: "https://i.pravatar.cc/150?img=16" }
    ],
    attachments: 4,
    comments: 26
  }
];

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
    <div ref={setNodeRef} className="flex-shrink-0 w-[340px]">
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
          <div className="flex gap-6 overflow-x-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-[340px]">
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

        {/* Kanban Board */}
        <div className="p-8">
          <div className="flex gap-6 overflow-x-auto">
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
          <div className="w-[340px]">
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
