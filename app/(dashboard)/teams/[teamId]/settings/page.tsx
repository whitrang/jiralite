"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertTriangle, SaveIcon } from "lucide-react"

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

export default function TeamSettingsPage({ params }: { params: { teamId: string } }) {
  const [teamName, setTeamName] = useState(mockTeamSettings.name)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveTeamName = async () => {
    setIsSaving(true)
    console.log("Updating team name to:", teamName)
    setTimeout(() => {
      setIsSaving(false)
    }, 1000)
  }

  const handleDeleteTeam = () => {
    if (deleteConfirmation === mockTeamSettings.name) {
      console.log("Deleting team:", params.teamId)
      setIsDeleteModalOpen(false)
    }
  }

  const isTeamNameChanged = teamName !== mockTeamSettings.name

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
                />
                <Button
                  onClick={handleSaveTeamName}
                  disabled={!isTeamNameChanged || !teamName.trim() || isSaving}
                >
                  <SaveIcon />
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
            <div className="space-y-4">
              <div>
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
            </div>
          </CardContent>
        </Card>
      </div>

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
                Type <span className="font-bold">{mockTeamSettings.name}</span> to confirm
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
              disabled={deleteConfirmation !== mockTeamSettings.name}
            >
              Delete Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
