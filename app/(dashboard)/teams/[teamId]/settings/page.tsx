"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertTriangle, SaveIcon, Loader2Icon, LogOutIcon } from "lucide-react"
import { getTeamById, deleteTeam, updateTeam } from "@/lib/api/teams"
import { getUserRole, leaveTeam } from "@/lib/api/teamMembers"
import { getCurrentUserId } from "@/lib/api/auth"

interface TeamSettings {
  name: string
  createdAt: string
  memberCount: number
  projectCount: number
}

const mockTeamSettings: TeamSettings = {
  name: "Development Team",
  createdAt: "2024-01-15",
  memberCount: 8,
  projectCount: 5,
}

type TeamRole = "OWNER" | "ADMIN" | "MEMBER"

export default function TeamSettingsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params)
  const router = useRouter()
  const [teamName, setTeamName] = useState(mockTeamSettings.name)
  const [originalTeamName, setOriginalTeamName] = useState(mockTeamSettings.name)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<TeamRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadTeamSettings()
  }, [teamId])

  async function loadTeamSettings() {
    try {
      setIsLoading(true)

      const userId = await getCurrentUserId()
      if (!userId) {
        router.push("/login")
        return
      }
      setCurrentUserId(userId)

      const team = await getTeamById(teamId, userId)
      if (team) {
        setTeamName(team.name)
        setOriginalTeamName(team.name)
      }

      const role = await getUserRole(teamId, userId)
      setUserRole(role)
    } catch (err) {
      console.error("Error loading team settings:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTeamName = async () => {
    if (!currentUserId || !teamName.trim()) return

    try {
      setIsSaving(true)
      await updateTeam(teamId, teamName.trim(), currentUserId)
      setOriginalTeamName(teamName.trim())
      alert("Team name updated successfully!")
    } catch (err: any) {
      console.error("Error updating team name:", err)
      if (err.message === 'NOT_FOUND') {
        alert("Team not found or you don't have access.")
      } else if (err.message === 'FORBIDDEN') {
        alert("You don't have permission to update team name. Only OWNER and ADMIN can update.")
      } else {
        alert("Failed to update team name. Please try again.")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!currentUserId || deleteConfirmation !== teamName) return

    try {
      setIsDeleting(true)
      await deleteTeam(teamId, currentUserId)
      router.push("/teams")
    } catch (err: any) {
      console.error("Error deleting team:", err)
      alert(err.message || "Failed to delete team. Please try again.")
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
      setDeleteConfirmation("")
    }
  }

  const handleLeaveTeam = async () => {
    if (!currentUserId) return

    try {
      setIsLeaving(true)
      await leaveTeam(teamId, currentUserId)
      router.push("/teams")
    } catch (err: any) {
      console.error("Error leaving team:", err)
      alert(err.message || "Failed to leave team. Please try again.")
    } finally {
      setIsLeaving(false)
    }
  }

  const isTeamNameChanged = teamName.trim() !== originalTeamName
  const isOwner = userRole === "OWNER"
  const canLeaveTeam = userRole === "ADMIN" || userRole === "MEMBER"
  const canEditTeamName = userRole === "OWNER" || userRole === "ADMIN"

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Team Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your team settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>
              Update your team name and basic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="team-name" className="text-sm font-medium">
                Team Name
              </label>
              <div className="flex gap-2">
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  maxLength={50}
                  placeholder="Enter team name"
                  disabled={!canEditTeamName || isLoading}
                />
                <Button
                  onClick={handleSaveTeamName}
                  disabled={!canEditTeamName || !isTeamNameChanged || !teamName.trim() || isSaving}
                >
                  {isSaving && <Loader2Icon className="animate-spin" />}
                  {!isSaving && <SaveIcon />}
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {teamName.length}/50 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {new Date(mockTeamSettings.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Members</p>
                <p className="text-sm font-medium">
                  {mockTeamSettings.memberCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projects</p>
                <p className="text-sm font-medium">
                  {mockTeamSettings.projectCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {canLeaveTeam && (
                <div>
                  <h3 className="font-semibold mb-2">Leave Team</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You will lose access to all team projects and data. You can be re-invited later.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setIsLeaveModalOpen(true)}
                  >
                    <LogOutIcon />
                    Leave Team
                  </Button>
                </div>
              )}

              {isOwner && (
                <div className={canLeaveTeam ? "pt-4 border-t" : ""}>
                  <h3 className="font-semibold mb-2">Delete Team</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete a team, there is no going back. This will permanently delete the team, all projects, and all associated data.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    Delete Team
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Team Modal */}
      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Leave Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this team? You will lose access to all team projects and data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You can be re-invited by team admins or owners later.
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

      {/* Delete Team Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Team</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the team and all associated projects and data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="confirm-delete" className="text-sm font-medium">
                Type <span className="font-bold">{teamName}</span> to confirm
              </label>
              <Input
                id="confirm-delete"
                placeholder="Team name"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setDeleteConfirmation("")
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTeam}
              disabled={deleteConfirmation !== teamName || isDeleting}
            >
              {isDeleting && <Loader2Icon className="animate-spin" />}
              Delete Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
