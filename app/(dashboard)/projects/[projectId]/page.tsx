"use client";

import { KanbanCard } from "@/components/ui/kanban-card";
import { Filter, Search, X, Edit2, Trash2, Send, Sparkles, MessageSquare } from "lucide-react";
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
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { use } from "react";
import { getProjectIssues } from "@/lib/api/issues";
import { getProjectById } from "@/lib/api/projects";
import { askGPT } from "@/lib/api/gpt";
import {
  getCachedAiAdvice,
  setCachedAiAdvice,
  getCachedLabelRecommendations,
  setCachedLabelRecommendations,
  getCachedCommentSummary,
  setCachedCommentSummary,
  invalidateCommentSummaryCache,
  invalidateAllAiCaches,
  validateDescriptionForAI,
} from "@/lib/api/aiCache";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function SortableCard({ task, isOverlay = false, onCardClick }: { task: Task; isOverlay?: boolean; onCardClick?: (task: Task) => void }) {
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
      <div
        className={`transition-all duration-200 ${isOver ? 'mt-8' : 'mt-0'}`}
        onClick={(e) => {
          // Only trigger card click if not dragging
          if (onCardClick && !isDragging) {
            e.stopPropagation();
            onCardClick(task);
          }
        }}
      >
        <KanbanCard
          image={task.image}
          badges={task.badges}
          title={task.title}
          description={task.description}
          assignees={task.assignees}
          attachments={task.attachments}
          comments={task.comments}
          dueDate={task.dueDate}
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
  onCardClick,
}: {
  id: string;
  title: string;
  count: number;
  badgeColor: string;
  tasks: Task[];
  onCardClick?: (task: Task) => void;
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
          <SortableCard key={task.id} task={task} onCardClick={onCardClick} />
        ))}
      </div>
    </div>
  );
}

interface FilterState {
  searchText: string;
  statuses: TaskStatus[];
  assignees: string[];
  priorities: ("HIGH" | "MEDIUM" | "LOW")[];
  labels: string[];
  hasDueDate?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
}

type SortOption = "created_at" | "due_date" | "priority" | "updated_at";

// Helper function to generate consistent avatar based on name
const getAvatarUrl = (name: string, fallbackImage?: string | null) => {
  if (fallbackImage) return fallbackImage;
  // UI Avatars generates consistent avatars based on name
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=150&bold=true`;
};

export default function ProjectsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchText: "",
    statuses: [],
    assignees: [],
    priorities: [],
    labels: [],
  });
  const [sortBy, setSortBy] = useState<SortOption>("created_at");
  const [availableAssignees, setAvailableAssignees] = useState<any[]>([]);
  const [availableLabels, setAvailableLabels] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [isIssueDetailOpen, setIsIssueDetailOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [projectLabels, setProjectLabels] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [isLoadingAiAdvice, setIsLoadingAiAdvice] = useState(false);
  const [recommendedLabels, setRecommendedLabels] = useState<any[]>([]);
  const [isLoadingLabelRecommendations, setIsLoadingLabelRecommendations] = useState(false);
  const [commentSummary, setCommentSummary] = useState<string>("");
  const [isLoadingCommentSummary, setIsLoadingCommentSummary] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    checkAuthAndLoadData();
  }, [projectId]);

  // Apply filters and sorting when tasks or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [tasks, filters, sortBy]);

  // Open issue modal from URL parameter
  useEffect(() => {
    const issueId = searchParams.get('issue');
    if (issueId && tasks.length > 0 && !loading) {
      const task = tasks.find(t => t.id === issueId);
      if (task && !isIssueDetailOpen) {
        handleCardClick(task);
      }
    } else if (!issueId && isIssueDetailOpen) {
      // Close modal if URL param is removed
      setIsIssueDetailOpen(false);
      setSelectedIssue(null);
    }
  }, [searchParams, tasks, loading]);

  const checkAuthAndLoadData = async () => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      // Load current user profile
      const { data: userData } = await supabase
        .from("users")
        .select("id, name, profile_image")
        .eq("id", session.user.id)
        .single();

      if (userData) {
        setCurrentUser(userData);
        // Load specific project and its issues with user data
        await loadProjectData(projectId, userData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

  const loadProjectData = async (projectId: string, userData?: any) => {
    try {
      // Get project details
      const project = await getProjectById(projectId);

      if (!project) {
        setLoading(false);
        return;
      }

      setCurrentProject(project);

      // Load all projects from all teams the user belongs to
      const user = userData || currentUser;
      if (user) {
        // Get all teams the user is a member of
        const { data: teamMembers } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id);

        if (teamMembers && teamMembers.length > 0) {
          const teamIds = teamMembers.map(tm => tm.team_id);

          // Get all projects from these teams
          const { data: projects } = await supabase
            .from("projects")
            .select("id, name, team_id, teams!inner(name)")
            .in("team_id", teamIds)
            .eq("is_archived", false)
            .is("deleted_at", null)
            .order("name", { ascending: true });

          if (projects) {
            setAllProjects(projects);
          }
        }
      }

      // Load issues for this project
      await loadProjectIssues(projectId);

      setLoading(false);
    } catch (error) {
      console.error("Error loading project data:", error);
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...tasks];

    // Search by title
    if (filters.searchText) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(filters.searchText.toLowerCase())
      );
    }

    // Filter by status
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(task => filters.statuses.includes(task.status));
    }

    // Filter by assignees
    if (filters.assignees.length > 0) {
      filtered = filtered.filter(task =>
        task.assignees.some(assignee => filters.assignees.includes(assignee.name))
      );
    }

    // Filter by priorities
    if (filters.priorities.length > 0) {
      filtered = filtered.filter(task => {
        const taskPriorityBadge = task.badges.find(b =>
          ["HIGH", "MEDIUM", "LOW"].includes(b.label)
        );
        return taskPriorityBadge && filters.priorities.includes(taskPriorityBadge.label as any);
      });
    }

    // Filter by labels
    if (filters.labels.length > 0) {
      filtered = filtered.filter(task =>
        task.badges.some(badge => filters.labels.includes(badge.label))
      );
    }

    // Filter by due date presence
    if (filters.hasDueDate !== undefined) {
      filtered = filtered.filter(task =>
        filters.hasDueDate ? task.dueDate !== undefined : task.dueDate === undefined
      );
    }

    // Filter by due date range
    if (filters.dueDateFrom) {
      const fromDate = new Date(filters.dueDateFrom);
      filtered = filtered.filter(task =>
        task.dueDate && task.dueDate >= fromDate
      );
    }

    if (filters.dueDateTo) {
      const toDate = new Date(filters.dueDateTo);
      filtered = filtered.filter(task =>
        task.dueDate && task.dueDate <= toDate
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "created_at":
          return b.createdAt.getTime() - a.createdAt.getTime();
        case "due_date":
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.getTime() - b.dueDate.getTime();
        case "priority":
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return (priorityOrder[a.priority || "medium"] || 1) - (priorityOrder[b.priority || "medium"] || 1);
        default:
          return 0;
      }
    });

    setFilteredTasks(filtered);
  };

  const loadProjectIssues = async (projectId: string) => {
    try {
      // Get project to find team_id
      const { data: project } = await supabase
        .from("projects")
        .select("team_id")
        .eq("id", projectId)
        .single();

      if (project) {
        // Load team members
        const { data: members } = await supabase
          .from("team_members")
          .select(`
            user:user_id(id, name, profile_image)
          `)
          .eq("team_id", project.team_id);

        if (members) {
          setTeamMembers(members.map((m: any) => m.user));
        }

        // Load project labels
        const { data: labels } = await supabase
          .from("labels")
          .select("*")
          .eq("project_id", projectId);

        if (labels) {
          setProjectLabels(labels);
        }
      }

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
        .eq("project_id", projectId)
        .is("deleted_at", null)
        .order("position", { ascending: true });

      if (issuesError) throw issuesError;

      // Collect unique assignees and labels
      const assignees = new Set<string>();
      const labels = new Set<string>();

      issues?.forEach((issue: any) => {
        if (issue.assignee) {
          assignees.add(issue.assignee.name);
        }
        issue.issue_labels?.forEach((il: any) => {
          labels.add(il.label.name);
        });
      });

      setAvailableAssignees(Array.from(assignees).map(name => ({ name })));
      setAvailableLabels(Array.from(labels).map(name => ({ name })));

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
          avatar: getAvatarUrl(issue.assignee.name, issue.assignee.profile_image),
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
    } catch (error) {
      console.error("Error loading issues:", error);
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
            {[1, 2, 3, 4].map((i) => (
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

  const backlogTasks = filteredTasks.filter((t) => t.status === "Backlog");
  const todoTasks = filteredTasks.filter((t) => t.status === "To Do");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "In Progress");
  const completedTasks = filteredTasks.filter((t) => t.status === "Done");

  const activeTask = tasks.find((t) => t.id === activeId);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleFilterValue = (key: "statuses" | "assignees" | "priorities" | "labels", value: any) => {
    setFilters(prev => {
      const currentArray = prev[key] as any[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];
      return { ...prev, [key]: newArray };
    });
  };

  const clearFilters = () => {
    setFilters({
      searchText: "",
      statuses: [],
      assignees: [],
      priorities: [],
      labels: [],
    });
  };

  const hasActiveFilters = () => {
    return filters.searchText !== "" ||
      filters.statuses.length > 0 ||
      filters.assignees.length > 0 ||
      filters.priorities.length > 0 ||
      filters.labels.length > 0 ||
      filters.hasDueDate !== undefined ||
      filters.dueDateFrom !== undefined ||
      filters.dueDateTo !== undefined;
  };

  const handleCardClick = async (task: Task) => {
    // Update URL with issue parameter
    const url = new URL(window.location.href);
    url.searchParams.set('issue', task.id);
    router.push(url.pathname + url.search, { scroll: false });

    // Fetch full issue details from database
    const { data: issue, error } = await supabase
      .from("issues")
      .select(`
        *,
        assignee:assignee_user_id(id, name, profile_image),
        creator:creator_id(id, name, profile_image),
        issue_labels(
          label:label_id(id, name, color)
        )
      `)
      .eq("id", task.id)
      .single();

    if (!error && issue) {
      setSelectedIssue(issue);
      setEditedTitle(issue.title);
      setEditedDescription(issue.description || "");
      setIsIssueDetailOpen(true);

      // Load cached AI data when opening issue
      const cachedAdvice = getCachedAiAdvice(
        issue.id,
        issue.updated_at || issue.created_at
      );
      if (cachedAdvice) {
        setAiAdvice(cachedAdvice);
      } else {
        setAiAdvice("");
      }

      // Reset label recommendations (they need project context)
      setRecommendedLabels([]);

      // Load comments for this issue
      loadComments(issue.id);
    }
  };

  const loadComments = async (issueId: string) => {
    const { data: commentsData, error } = await supabase
      .from("comments")
      .select(`
        *,
        user:user_id(id, name, profile_image)
      `)
      .eq("issue_id", issueId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (!error && commentsData) {
      setComments(commentsData);
    }
  };

  const handleUpdateIssueField = async (field: string, value: any) => {
    if (!selectedIssue) return;

    const { error } = await supabase
      .from("issues")
      .update({ [field]: value })
      .eq("id", selectedIssue.id);

    if (!error) {
      // Update local state
      const updatedIssue = { ...selectedIssue, [field]: value };
      
      // If updating assignee_user_id, also update assignee object
      if (field === "assignee_user_id") {
        if (value === null) {
          updatedIssue.assignee = null;
        } else {
          // Find the assignee from team members
          const assignee = teamMembers.find(m => m.id === value);
          if (assignee) {
            updatedIssue.assignee = assignee;
          }
        }
      }
      
      setSelectedIssue(updatedIssue);

      // Refresh tasks list to reflect changes
      if (currentProject) {
        await loadProjectIssues(currentProject.id);
      }
    } else {
      console.error(`Error updating ${field}:`, error);
    }
  };

  const handleSaveTitle = async () => {
    if (!selectedIssue || !editedTitle.trim()) return;

    await handleUpdateIssueField("title", editedTitle.trim());
    setIsEditingTitle(false);
  };

  const handleSaveDescription = async () => {
    if (!selectedIssue) return;

    await handleUpdateIssueField("description", editedDescription.trim() || null);

    // Invalidate AI caches when description is updated
    invalidateAllAiCaches(selectedIssue.id);
    setAiAdvice("");
    setRecommendedLabels([]);

    setIsEditingDescription(false);
  };

  const handleDeleteIssue = async () => {
    if (!selectedIssue) return;

    if (!confirm("Are you sure you want to delete this issue?")) return;

    const { error } = await supabase
      .from("issues")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", selectedIssue.id);

    if (!error) {
      // Remove issue parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('issue');
      router.push(url.pathname + url.search, { scroll: false });

      setIsIssueDetailOpen(false);
      setSelectedIssue(null);

      // Refresh tasks list
      if (currentProject) {
        await loadProjectIssues(currentProject.id);
      }
    } else {
      console.error("Error deleting issue:", error);
    }
  };

  const handlePostComment = async () => {
    if (!selectedIssue || !newComment.trim()) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("comments")
      .insert({
        issue_id: selectedIssue.id,
        user_id: session.user.id,
        content: newComment.trim(),
      });

    if (!error) {
      setNewComment("");

      // Invalidate comment summary cache when new comment is added
      invalidateCommentSummaryCache(selectedIssue.id);
      setCommentSummary("");

      // Reload comments
      await loadComments(selectedIssue.id);

      // Refresh tasks to update comment count
      if (currentProject) {
        await loadProjectIssues(currentProject.id);
      }
    } else {
      console.error("Error posting comment:", error);
    }
  };

  const handleSummarizeComments = async () => {
    if (!selectedIssue || !currentUser) return;
    if (comments.length < 5) return;

    setIsLoadingCommentSummary(true);
    setCommentSummary("");

    try {
      // Get last comment timestamp for cache validation
      const lastCommentTime = comments.length > 0
        ? comments[comments.length - 1].created_at
        : new Date().toISOString();

      // Check cache first
      const cached = getCachedCommentSummary(
        selectedIssue.id,
        lastCommentTime
      );

      if (cached) {
        setCommentSummary(cached);
        setIsLoadingCommentSummary(false);
        return;
      }

      // Prepare comments context
      const commentsContext = comments
        .map((c: any, idx: number) =>
          `Comment ${idx + 1} (by ${c.user?.name || 'Unknown'}, ${new Date(c.created_at).toLocaleDateString()}):\n${c.content}`
        )
        .join('\n\n');

      const prompt = `Based on the following comments from an issue discussion, please provide:

1. A brief summary of the discussion (3-5 sentences)
2. Key decisions made (if any)

Comments:
${commentsContext}

IMPORTANT: Provide your response in PLAIN TEXT ONLY. Do NOT use any markdown formatting. Use simple numbering and line breaks.`;

      const response = await askGPT(
        prompt,
        "You are a helpful assistant that summarizes technical discussions. Be concise and focus on actionable outcomes.",
        undefined,
        currentUser.id
      );

      // Cache the result
      setCachedCommentSummary(
        selectedIssue.id,
        response,
        lastCommentTime
      );

      setCommentSummary(response);
    } catch (error: any) {
      console.error("Error summarizing comments:", error);
      if (error.message && error.message.includes('Rate limit')) {
        setCommentSummary(`⚠️ ${error.message}`);
      } else {
        setCommentSummary(`⚠️ Failed to summarize comments: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoadingCommentSummary(false);
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    if (!selectedIssue) return;

    // Find the issue_label record to delete
    const { error } = await supabase
      .from("issue_labels")
      .delete()
      .eq("issue_id", selectedIssue.id)
      .eq("label_id", labelId);

    if (!error) {
      // Update local state
      setSelectedIssue({
        ...selectedIssue,
        issue_labels: selectedIssue.issue_labels.filter((il: any) => il.label.id !== labelId)
      });

      // Refresh tasks to update badges
      if (currentProject) {
        await loadProjectIssues(currentProject.id);
      }
    } else {
      console.error("Error removing label:", error);
    }
  };

  const handleAddLabel = async (labelId: string) => {
    if (!selectedIssue) return;

    const labelToAdd = projectLabels.find((l: any) => l.id === labelId);
    if (!labelToAdd) return;

    // Insert into issue_labels
    const { error } = await supabase
      .from("issue_labels")
      .insert({
        issue_id: selectedIssue.id,
        label_id: labelToAdd.id,
      });

    if (!error) {
      // Update local state
      setSelectedIssue({
        ...selectedIssue,
        issue_labels: [
          ...(selectedIssue.issue_labels || []),
          { label: labelToAdd }
        ]
      });

      // Refresh tasks to update badges
      if (currentProject) {
        await loadProjectIssues(currentProject.id);
      }
    } else {
      console.error("Error adding label:", error);
    }
  };

  const handleGetAiAdvice = async () => {
    if (!selectedIssue || !currentUser) return;

    // Validate description length
    const validation = validateDescriptionForAI(selectedIssue.description);
    if (!validation.valid) {
      setAiAdvice(`⚠️ ${validation.message}`);
      return;
    }

    setIsLoadingAiAdvice(true);
    setAiAdvice("");

    try {
      // Check cache first
      const cached = getCachedAiAdvice(
        selectedIssue.id,
        selectedIssue.updated_at || selectedIssue.created_at
      );

      if (cached) {
        setAiAdvice(cached);
        setIsLoadingAiAdvice(false);
        return;
      }

      const issueContext = `
Title: ${selectedIssue.title}
Description: ${selectedIssue.description || "No description provided"}
Priority: ${selectedIssue.priority}
Status: ${selectedIssue.status}
`;

      const prompt = `Based on the following task/issue, please provide:
1. A detailed todo list (step-by-step tasks) to complete this work
2. An estimated time range to complete this task

${issueContext}

IMPORTANT: Provide your response in PLAIN TEXT ONLY. Do NOT use any markdown formatting like **, *, #, -, or any other markdown syntax. Just use plain text with line breaks and simple numbering like 1., 2., 3.`;

      const response = await askGPT(
        prompt,
        "You are a helpful project management assistant. Provide practical, actionable advice for software development tasks. Always respond in plain text without any markdown formatting.",
        undefined,
        currentUser.id
      );

      // Cache the result
      setCachedAiAdvice(
        selectedIssue.id,
        response,
        selectedIssue.updated_at || selectedIssue.created_at
      );

      setAiAdvice(response);
    } catch (error: any) {
      console.error("Error getting AI advice:", error);
      if (error.message && error.message.includes('Rate limit')) {
        setAiAdvice(`⚠️ ${error.message}`);
      } else if (error.message && error.message.includes('API key')) {
        setAiAdvice("⚠️ Failed to get AI advice. Please make sure your OpenAI API key is configured.");
      } else {
        setAiAdvice(`⚠️ Failed to get AI advice: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoadingAiAdvice(false);
    }
  };

  const handleGetLabelRecommendations = async () => {
    if (!selectedIssue || !currentUser || !currentProject) return;

    // Validate description length
    const validation = validateDescriptionForAI(selectedIssue.description);
    if (!validation.valid) {
      alert(`⚠️ ${validation.message}`);
      return;
    }

    setIsLoadingLabelRecommendations(true);
    setRecommendedLabels([]);

    try {
      // Get available labels for this project
      const availableLabels = projectLabels.filter(
        (label: any) => !selectedIssue.issue_labels?.some((il: any) => il.label.id === label.id)
      );

      if (availableLabels.length === 0) {
        setRecommendedLabels([]);
        setIsLoadingLabelRecommendations(false);
        return;
      }

      // Check cache first
      const cached = getCachedLabelRecommendations(
        selectedIssue.id,
        selectedIssue.updated_at || selectedIssue.created_at
      );

      if (cached) {
        // Parse cached response
        const trimmedResponse = cached.trim().toLowerCase();

        if (trimmedResponse !== 'none' && trimmedResponse) {
          const recommendedLabelNames = trimmedResponse
            .split(',')
            .map(name => name.trim())
            .filter(name => name.length > 0)
            .slice(0, 3);

          const recommended = availableLabels.filter((label: any) =>
            recommendedLabelNames.some(name =>
              label.name.toLowerCase() === name || label.name.toLowerCase().includes(name)
            )
          ).slice(0, 3);

          setRecommendedLabels(recommended);
        }
        setIsLoadingLabelRecommendations(false);
        return;
      }

      const issueContext = `
Title: ${selectedIssue.title}
Description: ${selectedIssue.description || "No description provided"}
Priority: ${selectedIssue.priority}
`;

      const labelsContext = availableLabels.map((l: any) => l.name).join(", ");

      const prompt = `Based on the following issue, recommend up to 3 most relevant labels from the available labels list.

Issue:
${issueContext}

Available Labels: ${labelsContext}

IMPORTANT:
1. Only recommend labels from the available labels list
2. Recommend maximum 3 labels
3. Respond ONLY with the label names separated by commas (e.g., "bug, urgent, backend")
4. If no labels are relevant, respond with "none"
5. Do NOT include any other text or explanation`;

      const response = await askGPT(
        prompt,
        "You are a helpful assistant that categorizes issues. Only respond with label names or 'none'.",
        undefined,
        currentUser.id
      );

      // Cache the result
      setCachedLabelRecommendations(
        selectedIssue.id,
        response,
        selectedIssue.updated_at || selectedIssue.created_at
      );

      // Parse response
      const trimmedResponse = response.trim().toLowerCase();

      if (trimmedResponse === 'none' || !trimmedResponse) {
        setRecommendedLabels([]);
        return;
      }

      const recommendedLabelNames = trimmedResponse
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0)
        .slice(0, 3);

      const recommended = availableLabels.filter((label: any) =>
        recommendedLabelNames.some(name =>
          label.name.toLowerCase() === name || label.name.toLowerCase().includes(name)
        )
      ).slice(0, 3);

      setRecommendedLabels(recommended);
    } catch (error: any) {
      console.error("Error getting label recommendations:", error);
      if (error.message && error.message.includes('Rate limit')) {
        alert(`⚠️ ${error.message}`);
      } else {
        alert(`⚠️ Failed to get label recommendations: ${error.message || 'Unknown error'}`);
      }
      setRecommendedLabels([]);
    } finally {
      setIsLoadingLabelRecommendations(false);
    }
  };

  const handleAcceptLabelRecommendation = async (labelId: string) => {
    await handleAddLabel(labelId);
    setRecommendedLabels(prev => prev.filter((l: any) => l.id !== labelId));
  };

  const handleRejectLabelRecommendation = (labelId: string) => {
    setRecommendedLabels(prev => prev.filter((l: any) => l.id !== labelId));
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0">
          <div className="text-sm text-gray-500 mb-2">
            Project / {currentProject?.name || "Loading..."} / Board
          </div>

          {/* Project Title and Selector */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col items-center gap-4">
              <h1 className="text-4xl font-bold">{currentProject?.name || "Project Board"}</h1>
              {allProjects.length > 1 && currentProject && (
                <Select
                  value={projectId}
                  onValueChange={(value) => router.push(`/projects/${value}`)}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Switch project" />
                  </SelectTrigger>
                  <SelectContent>
                    {allProjects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                        {project.teams && ` • ${project.teams.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Filter and Sort Actions */}
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFilterOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  hasActiveFilters()
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
                {hasActiveFilters() && (
                  <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {[
                      filters.statuses.length,
                      filters.assignees.length,
                      filters.priorities.length,
                      filters.labels.length,
                    ].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </button>

              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">생성일순</SelectItem>
                  <SelectItem value="due_date">마감일순</SelectItem>
                  <SelectItem value="priority">우선순위순</SelectItem>
                  <SelectItem value="updated_at">최근 수정순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Kanban Board - Only this area scrolls horizontally */}
        <div className="flex-1 p-8 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-6 h-full">
            {/* BACKLOG Column */}
            <SortableContext items={backlogTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <DroppableColumn
                id="backlog"
                title="BACKLOG"
                count={backlogTasks.length}
                badgeColor="bg-gray-500"
                tasks={backlogTasks}
                onCardClick={handleCardClick}
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
                onCardClick={handleCardClick}
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
                onCardClick={handleCardClick}
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
                onCardClick={handleCardClick}
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
              dueDate={activeTask.dueDate}
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filter & Search</DialogTitle>
            <DialogDescription>
              Search and filter issues by various criteria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Title
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search issue title..."
                  value={filters.searchText}
                  onChange={(e) => handleFilterChange("searchText", e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {(["Backlog", "To Do", "In Progress", "Done"] as TaskStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleFilterValue("statuses", status)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      filters.statuses.includes(status)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="flex flex-wrap gap-2">
                {(["HIGH", "MEDIUM", "LOW"] as const).map((priority) => (
                  <button
                    key={priority}
                    onClick={() => toggleFilterValue("priorities", priority)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      filters.priorities.includes(priority)
                        ? priority === "HIGH"
                          ? "bg-red-600 text-white"
                          : priority === "MEDIUM"
                          ? "bg-yellow-600 text-white"
                          : "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee Filter */}
            {availableAssignees.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignee
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableAssignees.map((assignee) => (
                    <button
                      key={assignee.name}
                      onClick={() => toggleFilterValue("assignees", assignee.name)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        filters.assignees.includes(assignee.name)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {assignee.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Label Filter */}
            {availableLabels.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Labels
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableLabels.map((label) => (
                    <button
                      key={label.name}
                      onClick={() => toggleFilterValue("labels", label.name)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        filters.labels.includes(label.name)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Due Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasDueDate"
                    checked={filters.hasDueDate === true}
                    onChange={(e) =>
                      handleFilterChange("hasDueDate", e.target.checked ? true : undefined)
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="hasDueDate" className="text-sm text-gray-700">
                    Only issues with due date
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">From</label>
                    <input
                      type="date"
                      value={filters.dueDateFrom || ""}
                      onChange={(e) => handleFilterChange("dueDateFrom", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">To</label>
                    <input
                      type="date"
                      value={filters.dueDateTo || ""}
                      onChange={(e) => handleFilterChange("dueDateTo", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={clearFilters}
            >
              Clear
            </Button>
            <Button
              onClick={() => setIsFilterOpen(false)}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Detail Dialog */}
      <Dialog
        open={isIssueDetailOpen}
        onOpenChange={(open) => {
          setIsIssueDetailOpen(open);
          if (!open) {
            // Remove issue parameter from URL when closing
            const url = new URL(window.location.href);
            url.searchParams.delete('issue');
            router.push(url.pathname + url.search, { scroll: false });
            setSelectedIssue(null);
          }
        }}
      >
        <DialogContent className="max-w-[90vw] w-[800px] max-h-[95vh] overflow-y-auto">
          {selectedIssue && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {isEditingTitle ? (
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="flex-1 text-2xl font-bold border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveTitle();
                            if (e.key === "Escape") setIsEditingTitle(false);
                          }}
                        />
                        <Button size="sm" onClick={handleSaveTitle}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditingTitle(false);
                            setEditedTitle(selectedIssue.title);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <DialogTitle className="text-2xl font-bold mb-2">
                        {selectedIssue.title}
                      </DialogTitle>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="font-medium">Created by</span>
                      <div className="flex items-center gap-2">
                        <img
                          src={getAvatarUrl(selectedIssue.creator.name, selectedIssue.creator.profile_image)}
                          alt={selectedIssue.creator.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span>{selectedIssue.creator.name}</span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <span>{new Date(selectedIssue.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditingTitle(!isEditingTitle)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDeleteIssue}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Status, Priority, Assignee Section */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <Select
                      value={selectedIssue.status}
                      onValueChange={(value) => handleUpdateIssueField("status", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Backlog">Backlog</SelectItem>
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <Select
                      value={selectedIssue.priority}
                      onValueChange={(value) => handleUpdateIssueField("priority", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assignee */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignee
                    </label>
                    {selectedIssue.assignee ? (
                      <div className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <img
                            src={getAvatarUrl(selectedIssue.assignee.name, selectedIssue.assignee.profile_image)}
                            alt={selectedIssue.assignee.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-sm font-medium">{selectedIssue.assignee.name}</span>
                        </div>
                        <button
                          onClick={() => handleUpdateIssueField("assignee_user_id", null)}
                          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          title="Remove assignee"
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    ) : (
                      <Select
                        value=""
                        onValueChange={(value) => handleUpdateIssueField("assignee_user_id", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select assignee..." />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((member: any) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Labels Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Labels
                    </label>
                    {projectLabels.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleGetLabelRecommendations}
                        disabled={isLoadingLabelRecommendations || !validateDescriptionForAI(selectedIssue.description).valid}
                        className="text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!validateDescriptionForAI(selectedIssue.description).valid ? "Description must be at least 10 characters" : ""}
                      >
                        {isLoadingLabelRecommendations ? (
                          <>
                            <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-1" />
                            Getting...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI Recommend
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {/* Current Labels */}
                    <div className="flex flex-wrap gap-2">
                      {selectedIssue.issue_labels && selectedIssue.issue_labels.length > 0 ? (
                        selectedIssue.issue_labels.map((il: any) => (
                          <span
                            key={il.label.id}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                            style={{ backgroundColor: il.label.color }}
                          >
                            {il.label.name}
                            <X
                              className="w-3 h-3 cursor-pointer hover:bg-black/20 rounded-full"
                              onClick={() => handleRemoveLabel(il.label.id)}
                            />
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">No labels</span>
                      )}
                    </div>

                    {/* AI Recommended Labels */}
                    {recommendedLabels.length > 0 && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-900">
                            AI Recommended Labels
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recommendedLabels.map((label: any) => (
                            <div
                              key={label.id}
                              className="inline-flex items-center gap-1"
                            >
                              <span
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                                style={{ backgroundColor: label.color }}
                              >
                                {label.name}
                              </span>
                              <button
                                onClick={() => handleAcceptLabelRecommendation(label.id)}
                                className="p-1 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                                title="Accept"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleRejectLabelRecommendation(label.id)}
                                className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                                title="Reject"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Label Dropdown */}
                    {(() => {
                      const assignedLabelIds = selectedIssue.issue_labels?.map((il: any) => il.label.id) || [];
                      const availableLabels = projectLabels.filter(
                        (label: any) => !assignedLabelIds.includes(label.id)
                      );

                      return availableLabels.length > 0 ? (
                        <Select
                          value=""
                          onValueChange={(value) => {
                            if (value) {
                              handleAddLabel(value);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Add label..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableLabels.map((label: any) => (
                              <SelectItem key={label.id} value={label.id}>
                                {label.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm text-gray-500 italic">All labels assigned</span>
                      );
                    })()}
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={selectedIssue.due_date || ""}
                    onChange={(e) => handleUpdateIssueField("due_date", e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    {!isEditingDescription && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingDescription(true)}
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {isEditingDescription ? (
                    <div className="space-y-2">
                      <textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[120px]"
                        rows={6}
                        placeholder="Add a description..."
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveDescription}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditingDescription(false);
                            setEditedDescription(selectedIssue.description || "");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose max-w-none p-4 border border-gray-200 rounded-lg bg-gray-50 min-h-[120px] whitespace-pre-wrap">
                      {selectedIssue.description || (
                        <span className="text-gray-400 italic">No description provided</span>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Advice Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      AI Advice
                    </label>
                    <Button
                      size="sm"
                      onClick={handleGetAiAdvice}
                      disabled={isLoadingAiAdvice || !validateDescriptionForAI(selectedIssue.description).valid}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!validateDescriptionForAI(selectedIssue.description).valid ? "Description must be at least 10 characters" : ""}
                    >
                      {isLoadingAiAdvice ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Thinking...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Get AI Advice
                        </>
                      )}
                    </Button>
                  </div>

                  {!aiAdvice && !isLoadingAiAdvice && (
                    <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-1">
                        Get AI-powered suggestions for this task
                      </p>
                      <p className="text-xs text-gray-500">
                        AI will create a detailed todo list and estimate completion time
                      </p>
                    </div>
                  )}

                  {aiAdvice && (
                    <div className="p-4 border border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-900">
                          AI Recommendations
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                        {aiAdvice}
                      </div>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Comments ({comments.length})
                  </label>

                  {/* Comment Summary Display */}
                  {commentSummary && (
                    <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-900">
                          Discussion Summary
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                        {commentSummary}
                      </div>
                    </div>
                  )}

                  {/* Comment Input */}
                  <div className="mb-4">
                    <div className="flex gap-3">
                      <img
                        src={currentUser ? getAvatarUrl(currentUser.name, currentUser.profile_image) : "https://ui-avatars.com/api/?name=User&background=random&color=fff&size=150&bold=true"}
                        alt={currentUser?.name || "You"}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1">
                        <textarea
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                              handlePostComment();
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                        />
                        <div className="flex justify-end mt-2">
                          <Button
                            size="sm"
                            onClick={handlePostComment}
                            disabled={!newComment.trim()}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Post Comment
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4 mb-4">
                    {comments.length > 0 ? (
                      [...comments].reverse().map((comment: any) => (
                        <div key={comment.id} className="flex gap-3">
                          <img
                            src={getAvatarUrl(comment.user.name, comment.user.profile_image)}
                            alt={comment.user.name}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{comment.user.name}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.created_at).toLocaleString("ko-KR", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-4">
                        No comments yet. Be the first to comment!
                      </div>
                    )}
                  </div>

                  {/* Summarize Button - Full Width at Bottom */}
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleSummarizeComments}
                      disabled={comments.length < 5 || isLoadingCommentSummary}
                    >
                      {isLoadingCommentSummary ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Summarizing...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Summarize Comments
                        </>
                      )}
                    </Button>
                    {comments.length < 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        At least 5 comments are required to use the summarization feature
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
