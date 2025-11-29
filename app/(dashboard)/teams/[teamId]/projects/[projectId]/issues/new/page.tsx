export default function NewIssuePage({
  params,
}: {
  params: { teamId: string; projectId: string };
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Create New Issue</h1>
      <p className="text-gray-600">FR-030: Create Issue</p>
      <p className="text-gray-600">FR-043: AI Auto-Label</p>
      <p className="text-gray-600">FR-044: AI Duplicate Detection</p>
      <p className="text-sm text-gray-500">Team: {params.teamId} | Project: {params.projectId}</p>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md"
              placeholder="Enter issue title (1-200 characters)"
            />
            <button className="mt-2 text-sm text-blue-600 hover:text-blue-700">
              🤖 Check for duplicates
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="mt-1 block w-full border-gray-300 rounded-md"
              rows={8}
              placeholder="Enter issue description (max 5000 characters)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select className="mt-1 block w-full border-gray-300 rounded-md">
                <option>MEDIUM</option>
                <option>HIGH</option>
                <option>LOW</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Assignee</label>
              <select className="mt-1 block w-full border-gray-300 rounded-md">
                <option>Unassigned</option>
                <option>John Doe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input type="date" className="mt-1 block w-full border-gray-300 rounded-md" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Labels</label>
              <select multiple className="mt-1 block w-full border-gray-300 rounded-md">
                <option>Bug</option>
                <option>Feature</option>
              </select>
              <button className="mt-2 text-sm text-blue-600 hover:text-blue-700">
                🤖 AI Label Recommendation
              </button>
            </div>
          </div>

          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Create Issue
          </button>
        </div>
      </div>
    </div>
  );
}
