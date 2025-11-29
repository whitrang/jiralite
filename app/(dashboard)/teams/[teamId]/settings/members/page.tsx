"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlusIcon, MailIcon, UserMinusIcon, LogOutIcon, AlertTriangle, Loader2Icon } from "lucide-react"
import { getTeamMembers, getUserRole, inviteMember, updateMemberRole, removeMember, leaveTeam, TeamMemberWithUser } from "@/lib/api/teamMembers"
import { getCurrentUserId } from "@/lib/api/auth"

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

export default function TeamMembersPage({ params }: { params: { teamId: string } }) {
  const router = useRouter()
  const [members, setMembers] = useState<DisplayMember[]>([])
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isKickModalOpen, setIsKickModalOpen] = useState(false)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<DisplayMember | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInviting, setIsInviting] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMembers()
  }, [params.teamId])

  async function loadMembers() {
    try {
      setIsLoading(true)
      setError(null)

      const userId = await getCurrentUserId()
      if (!userId) {
        setError("Please log in to view team members")
        setIsLoading(false)
        return
      }

      setCurrentUserId(userId)

      // Get user's role in this team
      const role = await getUserRole(params.teamId, userId)
      setCurrentUserRole(role)

      // Get all team members
      const teamMembers = await getTeamMembers(params.teamId)

      // Transform to display format
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
    } catch (err) {
      console.error("Error loading members:", err)
      setError("Failed to load team members. Please try again.")
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
      await inviteMember(params.teamId, inviteEmail.trim(), currentUserId)
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
      await updateMemberRole(params.teamId, userId, newRole)

      // Update local state
      setMembers(prev =>
        prev.map(m => (m.id === memberId ? { ...m, role: newRole } : m))
      )
    } catch (err) {
      console.error("Error changing role:", err)
      alert("Failed to change role. Please try again.")
    }
  }

  const handleKickMember = async () => {
    if (!selectedMember || !currentUserId) return

    try {
      setIsRemoving(true)
      await removeMember(params.teamId, selectedMember.userId, currentUserId)

      // Update local state
      setMembers(prev => prev.filter(m => m.id !== selectedMember.id))
      setIsKickModalOpen(false)
      setSelectedMember(null)
    } catch (err) {
      console.error("Error removing member:", err)
      alert("Failed to remove member. Please try again.")
    } finally {
      setIsRemoving(false)
    }
  }

  const handleLeaveTeam = async () => {
    if (!currentUserId) return

    try {
      setIsLeaving(true)
      await leaveTeam(params.teamId, currentUserId)
      setIsLeaveModalOpen(false)

      // Redirect to teams page
      router.push("/teams")
    } catch (err: any) {
      console.error("Error leaving team:", err)
      alert(err.message || "Failed to leave team. Please try again.")
    } finally {
      setIsLeaving(false)
    }
  }

  const canChangeRole = (member: DisplayMember) => {
    if (!isOwner) return false
    if (member.userId === currentUserId) return false
    return true
  }

  const canKickMember = (member: DisplayMember) => {
    if (member.userId === currentUserId) return false
    if (member.role === "OWNER") return false
    if (!isAdmin) return false
    return true
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadMembers}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members and permissions
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <UserPlusIcon />
            Invite Member
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
          <CardDescription>
            View and manage team member roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Role</th>
                  <th className="text-left py-3 px-4 font-semibold">Joined</th>
                  <th className="text-right py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b last:border-0">
                    <td className="py-3 px-4">
                      <div className="font-medium">
                        {member.name}
                        {member.userId === currentUserId && (
                          <span className="text-muted-foreground text-xs ml-2">(You)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {member.email}
                    </td>
                    <td className="py-3 px-4">
                      {canChangeRole(member) ? (
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleChangeRole(member.id, member.userId, value as TeamRole)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OWNER">OWNER</SelectItem>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                            <SelectItem value="MEMBER">MEMBER</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        {canKickMember(member) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member)
                              setIsKickModalOpen(true)
                            }}
                          >
                            <UserMinusIcon />
                            Remove
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {!isOwner && (
        <Card className="mt-6 border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Leave Team
            </CardTitle>
            <CardDescription>
              Remove yourself from this team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You will lose access to all team projects and data.
            </p>
            <Button
              variant="destructive"
              onClick={() => setIsLeaveModalOpen(true)}
            >
              <LogOutIcon />
              Leave Team
            </Button>
          </CardContent>
        </Card>
      )}

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

      <Dialog open={isKickModalOpen} onOpenChange={setIsKickModalOpen}>
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
                setIsKickModalOpen(false)
                setSelectedMember(null)
              }}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleKickMember}
              disabled={isRemoving}
            >
              {isRemoving && <Loader2Icon className="animate-spin" />}
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Leave Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this team?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You will lose access to all team projects and data. You will need to be re-invited to join again.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLeaveModalOpen(false)}
              disabled={isLeaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveTeam}
              disabled={isLeaving}
            >
              {isLeaving && <Loader2Icon className="animate-spin" />}
              Leave Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
