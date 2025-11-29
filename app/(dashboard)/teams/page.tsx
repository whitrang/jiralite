"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { PlusIcon, SearchIcon, UsersIcon, FolderIcon, ActivityIcon, Loader2Icon } from "lucide-react"
import { getUserTeams, createTeam, hasRecentActivity, TeamWithRole } from "@/lib/api/teams"
import { getCurrentUserId } from "@/lib/api/auth"

type TeamRole = "OWNER" | "ADMIN" | "MEMBER"

interface TeamWithActivity extends TeamWithRole {
  hasRecentActivity: boolean
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

export default function TeamsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")
  const [teams, setTeams] = useState<TeamWithActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTeams()
  }, [])

  async function loadTeams() {
    try {
      setIsLoading(true)
      setError(null)

      const userId = await getCurrentUserId()
      if (!userId) {
        setError("Please log in to view your teams")
        setIsLoading(false)
        return
      }

      setCurrentUserId(userId)

      const userTeams = await getUserTeams(userId)

      // Check recent activity for each team
      const teamsWithActivity = await Promise.all(
        userTeams.map(async (team) => {
          const hasActivity = await hasRecentActivity(team.id)
          return {
            ...team,
            hasRecentActivity: hasActivity,
          }
        })
      )

      setTeams(teamsWithActivity)
    } catch (err) {
      console.error("Error loading teams:", err)
      setError("Failed to load teams. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateTeam = async () => {
    if (!currentUserId) {
      alert("Please log in to create a team")
      return
    }

    try {
      setIsCreating(true)
      await createTeam(newTeamName.trim(), currentUserId)
      setIsCreateModalOpen(false)
      setNewTeamName("")

      // Reload teams
      await loadTeams()
    } catch (err) {
      console.error("Error creating team:", err)
      alert("Failed to create team. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleTeamClick = (teamId: string) => {
    router.push(`/teams/${teamId}`)
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
          <Button onClick={loadTeams}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Teams</h1>
          <p className="text-muted-foreground mt-1">
            Manage and collaborate with your teams
          </p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a new team to collaborate with others. Team names must be between 1-50 characters.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="team-name" className="text-sm font-medium">
                  Team Name
                </label>
                <Input
                  id="team-name"
                  placeholder="Enter team name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  maxLength={50}
                  disabled={isCreating}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTeam}
                disabled={!newTeamName.trim() || isCreating}
              >
                {isCreating && <Loader2Icon className="animate-spin" />}
                Create Team
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            type="text"
            placeholder="Search teams..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredTeams.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No teams found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Try adjusting your search" : "Create your first team to get started"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <PlusIcon />
              Create Team
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <Card
              key={team.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                team.hasRecentActivity ? "border-primary/50 shadow-md" : ""
              }`}
              onClick={() => handleTeamClick(team.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{team.name}</CardTitle>
                  {team.hasRecentActivity && (
                    <ActivityIcon className="size-4 text-primary" />
                  )}
                </div>
                <div className="mt-2">
                  <Badge variant={getRoleBadgeVariant(team.role)}>
                    {team.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="size-4" />
                    <span>{team.memberCount} members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FolderIcon className="size-4" />
                    <span>{team.projectCount} projects</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
