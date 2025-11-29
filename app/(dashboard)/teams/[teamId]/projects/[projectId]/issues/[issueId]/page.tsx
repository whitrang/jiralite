export default function IssueDetailPage({
  params,
}: {
  params: { teamId: string; projectId: string; issueId: string };
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Issue #1: Fix login bug</h1>
          <p className="text-gray-600">FR-031: Issue Detail View</p>
          <p className="text-sm text-gray-500">
            Team: {params.teamId} | Project: {params.projectId} | Issue: {params.issueId}
          </p>
        </div>
        <button className="text-red-600 hover:text-red-700">Delete Issue</button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Description</h2>
              <div className="flex gap-2">
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  🤖 AI Summary
                </button>
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  🤖 AI Suggestion
                </button>
              </div>
            </div>
            <p className="text-gray-700">
              This is a detailed description of the issue...
            </p>
          </div>

          {/* Subtasks */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Subtasks (3/5)</h2>
            <p className="text-sm text-gray-600 mb-4">FR-039-2: Subtasks</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked readOnly />
                <span className="line-through">Subtask 1</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked readOnly />
                <span className="line-through">Subtask 2</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" />
                <span>Subtask 3</span>
              </div>
            </div>
            <button className="mt-4 text-sm text-blue-600 hover:text-blue-700">
              + Add Subtask
            </button>
          </div>

          {/* Comments */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Comments (5)</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                🤖 AI Comment Summary
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">FR-060, FR-061, FR-062, FR-063</p>

            <div className="space-y-4 mb-4">
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">John Doe</span>
                  <span className="text-sm text-gray-600">2 hours ago</span>
                </div>
                <p className="text-gray-700">This is a comment...</p>
                <div className="flex gap-2 mt-2">
                  <button className="text-sm text-blue-600 hover:text-blue-700">Edit</button>
                  <button className="text-sm text-red-600 hover:text-red-700">Delete</button>
                </div>
              </div>
            </div>

            <div>
              <textarea
                className="w-full border-gray-300 rounded-md"
                rows={3}
                placeholder="Write a comment (1-1000 characters)..."
              />
              <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Add Comment
              </button>
            </div>
          </div>

          {/* Change History */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Change History</h2>
            <p className="text-sm text-gray-600 mb-4">FR-039: Issue Change History</p>
            <div className="space-y-2">
              <div className="border-b pb-2">
                <p className="text-sm">
                  <span className="font-semibold">John Doe</span> changed status from{" "}
                  <span className="font-medium">Backlog</span> to{" "}
                  <span className="font-medium">In Progress</span>
                </p>
                <p className="text-xs text-gray-600">2 hours ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Status</p>
                <select className="mt-1 block w-full border-gray-300 rounded-md text-sm">
                  <option>Backlog</option>
                  <option>In Progress</option>
                  <option>Done</option>
                </select>
              </div>
              <div>
                <p className="text-gray-600">Priority</p>
                <select className="mt-1 block w-full border-gray-300 rounded-md text-sm">
                  <option>HIGH</option>
                  <option>MEDIUM</option>
                  <option>LOW</option>
                </select>
              </div>
              <div>
                <p className="text-gray-600">Assignee</p>
                <select className="mt-1 block w-full border-gray-300 rounded-md text-sm">
                  <option>John Doe</option>
                  <option>Unassigned</option>
                </select>
              </div>
              <div>
                <p className="text-gray-600">Due Date</p>
                <input type="date" className="mt-1 block w-full border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <p className="text-gray-600">Labels</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Bug</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    Feature
                  </span>
                </div>
              </div>
              <div>
                <p className="text-gray-600">Created</p>
                <p className="font-medium">2 days ago</p>
              </div>
              <div>
                <p className="text-gray-600">Creator</p>
                <p className="font-medium">John Doe</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
