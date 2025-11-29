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
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { IssueWithRelations } from "@/lib/database.types";

type TaskStatus = "Backlog" | "To Do" | "In Progress" | "Done";
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
  title,
  count,
  badgeColor,
  tasks,
}: {
  id: string;
  title: string;
  count: number;
  badgeColor: string;
  tasks: Task[];
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex-shrink-0 w-[340px]">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <span
          className={`${badgeColor} text-white text-xs px-2 py-1 rounded-full min-w-[24px] text-center`}
        >
          {count}
        </span>
      </div>
      <div ref={setNodeRef} className="space-y-4 min-h-[200px]">
        {tasks.map((task) => (
          <SortableCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      // Load user's first project and its issues
      await loadIssues(session.user.id);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

  const loadIssues = async (userId: string) => {
    try {
      // Get user's first team
      const { data: teamMembers, error: teamError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId)
        .limit(1);

      if (teamError) throw teamError;
      if (!teamMembers || teamMembers.length === 0) {
        setLoading(false);
        return;
      }

      const teamId = teamMembers[0].team_id;

      // Get first project of this team
      const { data: projects, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("team_id", teamId)
        .eq("is_archived", false)
        .is("deleted_at", null)
        .limit(1);

      if (projectError) throw projectError;
      if (!projects || projects.length === 0) {
        setLoading(false);
        return;
      }

      const project = projects[0];
      setCurrentProject(project);

      // Get issues with relations
      const { data: issues, error: issuesError } = await supabase
        .from("issues")
        .select(`
          *,
          assignee:assignee_user_id(id, name, profile_image),
          creator:creator_id(id, name, profile_image),
          issue_labels(
            label:label_id(id, name, color)
          )
        `)
        .eq("project_id", project.id)
        .is("deleted_at", null)
        .order("position", { ascending: true });

      if (issuesError) throw issuesError;

      // Get comments count for each issue
      const issueIds = issues?.map(i => i.id) || [];
      const { data: commentsData } = await supabase
        .from("comments")
        .select("issue_id")
        .in("issue_id", issueIds)
        .is("deleted_at", null);

      const commentsCount = commentsData?.reduce((acc: Record<string, number>, comment) => {
        acc[comment.issue_id] = (acc[comment.issue_id] || 0) + 1;
        return acc;
      }, {}) || {};

      // Transform issues to Task format
      const transformedTasks: Task[] = (issues || []).map((issue: any) => {
        // Map status to kanban columns
        let status: TaskStatus = "Backlog";
        if (issue.status === "To Do") status = "To Do";
        else if (issue.status === "In Progress") status = "In Progress";
        else if (issue.status === "Done") status = "Done";

        // Map priority
        const priorityMap: Record<string, "low" | "medium" | "high"> = {
          LOW: "low",
          MEDIUM: "medium",
          HIGH: "high",
        };

        // Get labels
        const labels = issue.issue_labels?.map((il: any) => ({
          label: il.label.name,
          variant: "default" as BadgeVariant,
        })) || [];

        // Get priority badge variant
        const priorityVariant: BadgeVariant =
          issue.priority === "HIGH" ? "danger" :
          issue.priority === "MEDIUM" ? "warning" : "success";

        // Add priority badge at the beginning
        const allBadges = [
          { label: issue.priority, variant: priorityVariant },
          ...labels
        ];

        // Get assignee
        const assignees = issue.assignee ? [{
          name: issue.assignee.name,
          avatar: issue.assignee.profile_image || `https://i.pravatar.cc/150?u=${issue.assignee.id}`,
        }] : [];

        return {
          id: issue.id,
          status,
          title: issue.title,
          description: issue.description || undefined,
          badges: allBadges,
          assignees,
          attachments: 0, // Not tracked in current schema
          comments: commentsCount[issue.id] || 0,
          priority: priorityMap[issue.priority] || "medium",
          createdAt: new Date(issue.created_at),
          dueDate: issue.due_date ? new Date(issue.due_date) : undefined,
        };
      });

      setTasks(transformedTasks);
      setLoading(false);
    } catch (error) {
      console.error("Error loading issues:", error);
      setLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  if (!isMounted || loading) {
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeTask = tasks.find((t) => t.id === active.id);
    const overId = over.id as string;

    // Determine new status based on drop zone
    let newStatus: TaskStatus | null = null;
    if (overId === "backlog" || tasks.find((t) => t.id === overId)?.status === "Backlog") {
      newStatus = "Backlog";
    } else if (overId === "todo" || tasks.find((t) => t.id === overId)?.status === "To Do") {
      newStatus = "To Do";
    } else if (overId === "inProgress" || tasks.find((t) => t.id === overId)?.status === "In Progress") {
      newStatus = "In Progress";
    } else if (overId === "completed" || tasks.find((t) => t.id === overId)?.status === "Done") {
      newStatus = "Done";
    }

    if (activeTask && newStatus && activeTask.status !== newStatus) {
      // Update in database
      const { error } = await supabase
        .from("issues")
        .update({ status: newStatus })
        .eq("id", activeTask.id);

      if (!error) {
        // Update local state
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === activeTask.id ? { ...t, status: newStatus! } : t
          )
        );
      } else {
        console.error("Error updating issue status:", error);
      }
    }

    setActiveId(null);
  };

  const backlogTasks = tasks.filter((t) => t.status === "Backlog");
  const todoTasks = tasks.filter((t) => t.status === "To Do");
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress");
  const completedTasks = tasks.filter((t) => t.status === "Done");

  const activeTask = tasks.find((t) => t.id === activeId);

  // Statistics calculations
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Status data for pie chart
  const statusData = [
    { name: "Backlog", value: backlogTasks.length, color: "#6b7280" },
    { name: "To Do", value: todoTasks.length, color: "#a855f7" },
    { name: "In Progress", value: inProgressTasks.length, color: "#ec4899" },
    { name: "Done", value: completedTasks.length, color: "#c084fc" },
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
    .filter((t) => t.dueDate && t.dueDate.getTime() > now && t.dueDate.getTime() <= sevenDaysLater && t.status !== "Done")
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
          <div className="text-sm text-gray-500 mb-2">
            Project / {currentProject?.name || "Loading..."} / Board
          </div>
          <h1 className="text-4xl font-bold mb-6">{currentProject?.name || "Project Board"}</h1>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between">
            <nav className="flex gap-8 border-b border-gray-200">
              <button className="pb-3 text-gray-500 hover:text-gray-900">Overview</button>
              <button className="pb-3 text-gray-900 border-b-2 border-gray-900 font-medium">Boards</button>
              <button className="pb-3 text-gray-500 hover:text-gray-900">Timeline</button>
              <button className="pb-3 text-gray-500 hover:text-gray-900">Activities</button>
              <button className="pb-3 text-gray-500 hover:text-gray-900">All</button>
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
                  <p className="text-sm text-gray-500 mb-1">Total Issues</p>
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
          <div className="flex gap-6 overflow-x-auto">
            {/* BACKLOG Column */}
            <SortableContext items={backlogTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <DroppableColumn
                id="backlog"
                title="BACKLOG"
                count={backlogTasks.length}
                badgeColor="bg-gray-500"
                tasks={backlogTasks}
              />
            </SortableContext>

            {/* TO DO Column */}
            <SortableContext items={todoTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <DroppableColumn
                id="todo"
                title="TO DO"
                count={todoTasks.length}
                badgeColor="bg-purple-500"
                tasks={todoTasks}
              />
            </SortableContext>

            {/* IN PROGRESS Column */}
            <SortableContext items={inProgressTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <DroppableColumn
                id="inProgress"
                title="IN PROGRESS"
                count={inProgressTasks.length}
                badgeColor="bg-pink-500"
                tasks={inProgressTasks}
              />
            </SortableContext>

            {/* DONE Column */}
            <SortableContext items={completedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <DroppableColumn
                id="completed"
                title="DONE"
                count={completedTasks.length}
                badgeColor="bg-purple-400"
                tasks={completedTasks}
              />
            </SortableContext>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80">
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
