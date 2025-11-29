"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { PlusIcon, SearchIcon, FolderIcon, ArchiveIcon, StarIcon, ClockIcon } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string
  issueCount: number
  isArchived: boolean
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Complete redesign of company website",
    issueCount: 15,
    isArchived: false,
    isFavorite: true,
    createdAt: "2024-01-15",
    updatedAt: "2024-03-20",
  },
  {
    id: "2",
    name: "Mobile App",
    description: "iOS and Android mobile application",
    issueCount: 8,
    isArchived: false,
    isFavorite: false,
    createdAt: "2024-02-01",
    updatedAt: "2024-03-18",
  },
  {
    id: "3",
    name: "API Development",
    description: "RESTful API for backend services",
    issueCount: 12,
    isArchived: false,
    isFavorite: true,
    createdAt: "2024-01-20",
    updatedAt: "2024-03-19",
  },
  {
    id: "4",
    name: "Old Marketing Campaign",
    description: "Q1 2023 marketing campaign",
    issueCount: 5,
    isArchived: true,
    isFavorite: false,
    createdAt: "2023-01-10",
    updatedAt: "2023-04-01",
  },
]

export default function TeamProjectsPage({ params }: { params: { teamId: string } }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesArchived = showArchived || !project.isArchived
    return matchesSearch && matchesArchived
  })

  const activeProjects = filteredProjects.filter(p => !p.isArchived)
  const archivedProjects = filteredProjects.filter(p => p.isArchived)

  const handleCreateProject = () => {
    console.log("Creating project:", newProjectName, newProjectDescription)
    setIsCreateModalOpen(false)
    setNewProjectName("")
    setNewProjectDescription("")
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/teams/${params.teamId}/projects/${projectId}`)
  }

  const toggleFavorite = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log("Toggle favorite:", projectId)
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team projects
          </p>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon />
          New Project
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            type="text"
            placeholder="Search projects..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant={showArchived ? "default" : "outline"}
          onClick={() => setShowArchived(!showArchived)}
        >
          <ArchiveIcon />
          {showArchived ? "Hide Archived" : "Show Archived"}
        </Button>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Try adjusting your search" : "Create your first project to get started"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <PlusIcon />
              New Project
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {activeProjects.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Active Projects ({activeProjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="cursor-pointer transition-all hover:shadow-lg relative"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl flex items-center gap-2">
                            <FolderIcon className="size-5" />
                            {project.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {project.description}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => toggleFavorite(project.id, e)}
                          className="shrink-0"
                        >
                          <StarIcon
                            className={`size-4 ${
                              project.isFavorite
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Issues</span>
                          <Badge variant="outline">{project.issueCount}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ClockIcon className="size-3" />
                          <span>
                            Updated {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {showArchived && archivedProjects.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                <ArchiveIcon className="size-5" />
                Archived Projects ({archivedProjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {archivedProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="cursor-pointer transition-all hover:shadow-lg opacity-60"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl flex items-center gap-2">
                            <ArchiveIcon className="size-5" />
                            {project.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {project.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Issues</span>
                          <Badge variant="outline">{project.issueCount}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ClockIcon className="size-3" />
                          <span>
                            Updated {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project for your team. Projects help organize issues and tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="project-name" className="text-sm font-medium">
                Project Name
              </label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {newProjectName.length}/100 characters
              </p>
            </div>
            <div className="grid gap-2">
              <label htmlFor="project-description" className="text-sm font-medium">
                Description (optional)
              </label>
              <textarea
                id="project-description"
                placeholder="Enter project description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                maxLength={2000}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <p className="text-xs text-muted-foreground">
                {newProjectDescription.length}/2000 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false)
                setNewProjectName("")
                setNewProjectDescription("")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
