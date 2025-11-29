export default function ProjectLabelsPage({
  params,
}: {
  params: { teamId: string; projectId: string };
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Label Management</h1>
      <p className="text-gray-600">FR-038: Issue Labels/Tags</p>
      <p className="text-sm text-gray-500">Team: {params.teamId} | Project: {params.projectId}</p>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Label</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Label name (1-30 characters)"
              className="flex-1 border-gray-300 rounded-md"
            />
            <input
              type="color"
              className="border-gray-300 rounded-md"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Create
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">Max 20 labels per project</p>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Existing Labels</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="font-medium">Bug</span>
              </div>
              <div className="flex gap-2">
                <button className="text-blue-600 hover:text-blue-700">Edit</button>
                <button className="text-red-600 hover:text-red-700">Delete</button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="font-medium">Feature</span>
              </div>
              <div className="flex gap-2">
                <button className="text-blue-600 hover:text-blue-700">Edit</button>
                <button className="text-red-600 hover:text-red-700">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
