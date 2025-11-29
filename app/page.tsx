import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Jira Lite
        </h1>
        <p className="text-2xl text-gray-600 mb-8">
          AI-Powered Issue Tracking Web Application
        </p>
        <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
          Manage your teams, projects, and issues with powerful AI features.
          Collaborate efficiently with kanban boards, comments, and real-time notifications.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
          >
            Log In
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Team Collaboration</h3>
            <p className="text-gray-600">
              Create teams, invite members, and manage projects together
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">AI-Powered</h3>
            <p className="text-gray-600">
              Get AI summaries, suggestions, auto-labels, and duplicate detection
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Kanban Boards</h3>
            <p className="text-gray-600">
              Drag & drop issues, custom statuses, and WIP limits
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
