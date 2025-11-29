"use client";

import { AlertCircle, Clock, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type TaskStatus = "Backlog" | "To Do" | "In Progress" | "Done";

interface Task {
  id: string;
  status: TaskStatus;
  title: string;
  priority?: "low" | "medium" | "high";
  createdAt: Date;
  dueDate?: Date;
}

export default function Dashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

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

      // Load user's issues
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

      // Get issues
      const { data: issues, error: issuesError } = await supabase
        .from("issues")
        .select("*")
        .eq("project_id", project.id)
        .is("deleted_at", null)
        .order("position", { ascending: true });

      if (issuesError) throw issuesError;

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

        return {
          id: issue.id,
          status,
          title: issue.title,
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

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const backlogTasks = tasks.filter((t) => t.status === "Backlog");
  const todoTasks = tasks.filter((t) => t.status === "To Do");
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress");
  const completedTasks = tasks.filter((t) => t.status === "Done");

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
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

        {/* Statistics Dashboard */}
        <div className="space-y-6">
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
                  <div 
                    key={task.id} 
                    className="pb-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 px-2 py-1 -mx-2 -my-1 mb-2 rounded cursor-pointer transition-colors"
                    onClick={() => router.push(`/projects?issueId=${task.id}`)}
                  >
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
                    <div 
                      key={task.id} 
                      className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => router.push(`/projects?issueId=${task.id}`)}
                    >
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
      </div>
    </div>
  );
}
