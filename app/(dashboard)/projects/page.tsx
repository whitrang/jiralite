"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Loader2Icon } from "lucide-react"

export default function ProjectsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    redirectToOldestProject()
  }, [])

  const redirectToOldestProject = async () => {
    try {
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
        // No teams found, redirect to teams page
        router.push("/teams")
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
        // No projects found, redirect to team page
        router.push(`/teams/${teamId}`)
        return
      }

      // Redirect to the oldest project
      router.push(`/projects/${projects[0].id}`)
    } catch (error) {
      console.error("Error redirecting to project:", error)
      router.push("/teams")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading project...</p>
      </div>
    </div>
  )
}
