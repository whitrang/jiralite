"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Loader2Icon, FolderOpen } from "lucide-react"
import Link from "next/link"

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
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="size-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Loading project...</p>
        </div>
      </div>
    )
  }

  if (noProjects) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Projects Found</h1>
          <p className="text-gray-600 mb-6">
            You don't have any projects yet. To create a project, you need to first create or join a team, then create a project within that team.
          </p>
          <Link
            href="/teams"
            className="inline-block bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Go to Teams
          </Link>
        </div>
      </div>
    )
  }

  return null
}
