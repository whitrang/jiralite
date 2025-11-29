"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { FolderOpen } from "lucide-react"
import Link from "next/link"
import { Spinner } from "@/components/ui/spinner"

export default function ProjectsRedirectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [noProjects, setNoProjects] = useState(false)

  useEffect(() => {
    redirectToOldestProject()
  }, [])

  const redirectToOldestProject = async () => {
    try {
      setLoading(true)
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
        return
      }

      // Get user's first team
      const { data: teamMembers, error: teamError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", session.user.id)
        .limit(1)

      if (teamError) throw teamError
      if (!teamMembers || teamMembers.length === 0) {
        // No teams found, show no projects message
        setNoProjects(true)
        setLoading(false)
        return
      }

      const teamId = teamMembers[0].team_id

      // Get oldest non-deleted project (ordered by created_at ascending)
      const { data: projects, error: projectError } = await supabase
        .from("projects")
        .select("id")
        .eq("team_id", teamId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(1)

      if (projectError) throw projectError

      if (!projects || projects.length === 0) {
        // No projects found, show no projects message
        setNoProjects(true)
        setLoading(false)
        return
      }

      // Redirect to the oldest project
      router.push(`/projects/${projects[0].id}`)
    } catch (error) {
      console.error("Error redirecting to project:", error)
      setNoProjects(true)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" label="Loading project..." />
      </div>
    )
  }

  if (noProjects) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center py-12">
          <FolderOpen className="mx-auto size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">
            Create your first team and project to get started
          </p>
          <Link
            href="/teams"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Go to Teams
          </Link>
        </div>
      </div>
    )
  }

  return null
}
