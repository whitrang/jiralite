export default function ProjectPage({
  params,
}: {
  params: { teamId: string; projectId: string };
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Project Name</h1>
          <p className="text-gray-600">FR-022: Project Detail Page</p>
          <p className="text-sm text-gray-500">Team: {params.teamId} | Project: {params.projectId}</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          New Issue
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          <button className="px-4 py-2 border-b-2 border-blue-600 font-medium">
            Kanban Board
          </button>
          <button className="px-4 py-2 text-gray-600 hover:text-gray-900">
            List View
          </button>
          <button className="px-4 py-2 text-gray-600 hover:text-gray-900">
            Dashboard
          </button>
        </nav>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto">
        <div className="flex-shrink-0 w-80 bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-4">Backlog (0/10)</h3>
          <div className="space-y-2">
            <div className="bg-white p-4 rounded shadow">
              <h4 className="font-medium">Issue Title</h4>
              <p className="text-sm text-gray-600">Priority: MEDIUM</p>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 w-80 bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-4">In Progress</h3>
        </div>
        <div className="flex-shrink-0 w-80 bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-4">Done</h3>
        </div>
      </div>
    </div>
  );
}
