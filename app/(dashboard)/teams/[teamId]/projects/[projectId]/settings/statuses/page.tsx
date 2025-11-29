export default function ProjectStatusesPage({
  params,
}: {
  params: { teamId: string; projectId: string };
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Custom Status Management</h1>
      <p className="text-gray-600">FR-053: Custom Columns (Custom Status)</p>
      <p className="text-gray-600">FR-054: WIP Limit</p>
      <p className="text-sm text-gray-500">Team: {params.teamId} | Project: {params.projectId}</p>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Create Custom Status</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Status name (1-30 characters)"
                className="flex-1 border-gray-300 rounded-md"
              />
              <input
                type="color"
                className="border-gray-300 rounded-md"
              />
              <input
                type="number"
                placeholder="WIP Limit"
                className="w-32 border-gray-300 rounded-md"
              />
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Create
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Default statuses (Backlog, In Progress, Done) + Max 5 custom statuses
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Existing Statuses</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-4">
                <span className="font-medium">Backlog</span>
                <span className="text-sm text-gray-600">(Default)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">WIP Limit: None</span>
                <button className="text-blue-600 hover:text-blue-700">Edit</button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-4">
                <span className="font-medium">In Progress</span>
                <span className="text-sm text-gray-600">(Default)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">WIP Limit: 10</span>
                <button className="text-blue-600 hover:text-blue-700">Edit</button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-4">
                <span className="font-medium">Done</span>
                <span className="text-sm text-gray-600">(Default)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">WIP Limit: None</span>
                <button className="text-blue-600 hover:text-blue-700">Edit</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
