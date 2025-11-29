"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2Icon,
  FolderIcon,
  PlusIcon,
  SettingsIcon,
  UsersIcon,
  UserPlusIcon,
  MailIcon,
  UserMinusIcon,
  StarIcon,
  ClockIcon
} from "lucide-react"
import { getTeamById } from "@/lib/api/teams"
import { getTeamMembers, getUserRole, inviteMember, updateMemberRole, removeMember, TeamMemberWithUser } from "@/lib/api/teamMembers"
import { getCurrentUserId } from "@/lib/api/auth"
import { supabase } from "@/lib/supabaseClient"

type TeamRole = "OWNER" | "ADMIN" | "MEMBER"

interface DisplayMember {
  id: string
  userId: string
  name: string
  email: string
  role: TeamRole
  joinedAt: string
  profileImage?: string | null
}

interface Project {
  id: string
  name: string
  description: string | null
  issueCount: number
  isArchived: boolean
  isFavorite: boolean
  updatedAt: string
}

function getRoleBadgeVariant(role: TeamRole): "default" | "secondary" | "outline" {
  switch (role) {
    case "OWNER":
      return "default"
    case "ADMIN":
      return "secondary"
    case "MEMBER":
      return "outline"
  }
}

export default function TeamDashboardPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params)
  const router = useRouter()
  const [teamName, setTeamName] = useState<string>("")
  const [members, setMembers] = useState<DisplayMember[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Invite modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [isInviting, setIsInviting] = useState(false)

  // Remove member modal
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<DisplayMember | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    loadTeamData()
  }, [teamId])

  async function loadTeamData() {
    try {
      setIsLoading(true)
      setError(null)

      const userId = await getCurrentUserId()
      if (!userId) {
        setError("Please log in to view team details")
        setIsLoading(false)
        return
      }

      setCurrentUserId(userId)

      // Get team info
      const team = await getTeamById(teamId)
      if (!team) {
        setError("Team not found")
        setIsLoading(false)
        return
      }
      setTeamName(team.name)

      // Get user's role
      const role = await getUserRole(teamId, userId)
      setCurrentUserRole(role)

      // Get team members
      const teamMembers = await getTeamMembers(teamId)
      const displayMembers: DisplayMember[] = teamMembers.map((tm) => ({
        id: tm.id,
        userId: tm.user_id,
        name: tm.users.name,
        email: tm.users.email,
        role: tm.role,
        joinedAt: tm.joined_at,
        profileImage: tm.users.profile_image,
      }))
      setMembers(displayMembers)

      // Get projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          description,
          is_archived,
          updated_at,
          project_favorites (
            user_id
          )
        `)
        .eq('team_id', teamId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })

      if (projectsError) throw projectsError

      // Get issue counts for each project
      const projectsWithCounts = await Promise.all(
        (projectsData || []).map(async (project: any) => {
          const { count } = await supabase
            .from('issues')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .is('deleted_at', null)

          return {
            id: project.id,
            name: project.name,
            description: project.description,
            issueCount: count || 0,
            isArchived: project.is_archived,
            isFavorite: project.project_favorites?.some((fav: any) => fav.user_id === userId) || false,
            updatedAt: project.updated_at,
          }
        })
      )

      setProjects(projectsWithCounts)
    } catch (err) {
      console.error("Error loading team data:", err)
      setError("Failed to load team data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const isOwner = currentUserRole === "OWNER"
  const isAdmin = currentUserRole === "ADMIN" || isOwner

  const handleInviteMember = async () => {
    if (!currentUserId) return

    try {
      setIsInviting(true)
      await inviteMember(teamId, inviteEmail.trim(), currentUserId)
      setIsInviteModalOpen(false)
      setInviteEmail("")
      alert("Invitation sent successfully!")
    } catch (err) {
      console.error("Error inviting member:", err)
      alert("Failed to send invitation. Please try again.")
    } finally {
      setIsInviting(false)
    }
  }

  const handleChangeRole = async (memberId: string, userId: string, newRole: TeamRole) => {
    try {
      await updateMemberRole(teamId, userId, newRole)
      setMembers(prev =>
        prev.map(m => (m.id === memberId ? { ...m, role: newRole } : m))
      )
    } catch (err) {
      console.error("Error changing role:", err)
      alert("Failed to change role. Please try again.")
    }
  }

  const handleRemoveMember = async () => {
    if (!selectedMember || !currentUserId) return

    try {
      setIsRemoving(true)
      await removeMember(teamId, selectedMember.userId, currentUserId)
      setMembers(prev => prev.filter(m => m.id !== selectedMember.id))
      setIsRemoveModalOpen(false)
      setSelectedMember(null)
    } catch (err) {
      console.error("Error removing member:", err)
      alert("Failed to remove member. Please try again.")
    } finally {
      setIsRemoving(false)
    }
  }

  const canChangeRole = (member: DisplayMember) => {
    if (!isOwner) return false
    if (member.userId === currentUserId) return false
    return true
  }

  const canRemoveMember = (member: DisplayMember) => {
    if (member.userId === currentUserId) return false
    if (member.role === "OWNER") return false
    if (!isAdmin) return false
    return true
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadTeamData}>Try Again</Button>
        </div>
      </div>
    )
  }

  const activeProjects = projects.filter(p => !p.isArchived)

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{teamName}</h1>
          <p className="text-muted-foreground mt-1">
            Team Dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/teams/${teamId}/settings`)}
          >
            <SettingsIcon />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members Section - 1/3 width */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="size-5" />
                  Members ({members.length})
                </CardTitle>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsInviteModalOpen(true)}
                  >
                    <UserPlusIcon />
                  </Button>
                )}
              </div>
              <CardDescription>
                Team members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {member.name}
                        {member.userId === currentUserId && (
                          <span className="text-muted-foreground text-xs ml-2">(You)</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {member.email}
                      </div>
                      <div className="mt-1">
                        {canChangeRole(member) ? (
                          <Select
                            value={member.role}
                            onValueChange={(value) =>
                              handleChangeRole(member.id, member.userId, value as TeamRole)
                            }
                          >
                            <SelectTrigger className="w-[110px] h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OWNER">OWNER</SelectItem>
                              <SelectItem value="ADMIN">ADMIN</SelectItem>
                              <SelectItem value="MEMBER">MEMBER</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                            {member.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {canRemoveMember(member) && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedMember(member)
                          setIsRemoveModalOpen(true)
                        }}
                      >
                        <UserMinusIcon className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {isAdmin && (
                <Button
                  className="w-full mt-4"
                  variant="outline"
                  onClick={() => router.push(`/teams/${teamId}/settings/members`)}
                >
                  Manage Members
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Projects Section - 2/3 width */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderIcon className="size-5" />
                  Projects ({activeProjects.length})
                </CardTitle>
                <Button onClick={() => router.push(`/teams/${teamId}/projects/new`)}>
                  <PlusIcon />
                  New Project
                </Button>
              </div>
              <CardDescription>
                Active projects in this team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeProjects.length === 0 ? (
                <div className="text-center py-12">
                  <FolderIcon className="mx-auto size-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first project to get started
                  </p>
                  <Button onClick={() => router.push(`/teams/${teamId}/projects/new`)}>
                    <PlusIcon />
                    New Project
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeProjects.map((project) => (
                    <Card
                      key={project.id}
                      className="cursor-pointer transition-all hover:shadow-md"
                      onClick={() => router.push(`/teams/${teamId}/projects/${project.id}`)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FolderIcon className="size-4" />
                            {project.name}
                          </CardTitle>
                          {project.isFavorite && (
                            <StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        {project.description && (
                          <CardDescription className="line-clamp-2">
                            {project.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Issues</span>
                          <Badge variant="outline">{project.issueCount}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <ClockIcon className="size-3" />
                          <span>
                            Updated {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {activeProjects.length > 0 && (
                <Button
                  className="w-full mt-4"
                  variant="outline"
                  onClick={() => router.push(`/teams/${teamId}/projects`)}
                >
                  View All Projects
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invite Member Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your team via email
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="invite-email" className="text-sm font-medium">
                Email Address
              </label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="member@example.com"
                  className="pl-10"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={isInviting}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsInviteModalOpen(false)
                setInviteEmail("")
              }}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={!inviteEmail.trim() || !inviteEmail.includes("@") || isInviting}
            >
              {isInviting && <Loader2Icon className="animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Modal */}
      <Dialog open={isRemoveModalOpen} onOpenChange={setIsRemoveModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this member from the team?
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="font-medium">{selectedMember.name}</p>
                <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                <Badge variant={getRoleBadgeVariant(selectedMember.role)} className="mt-2">
                  {selectedMember.role}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                This member will lose access to all team projects and data.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRemoveModalOpen(false)
                setSelectedMember(null)
              }}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={isRemoving}
            >
              {isRemoving && <Loader2Icon className="animate-spin" />}
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
