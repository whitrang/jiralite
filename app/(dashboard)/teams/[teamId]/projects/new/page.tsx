export default function NewProjectPage({ params }: { params: { teamId: string } }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Create New Project</h1>
      <p className="text-gray-600">FR-020: Create Project</p>
      <p className="text-sm text-gray-500">Team ID: {params.teamId}</p>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Name</label>
            <input
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md"
              placeholder="Enter project name (1-100 characters)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="mt-1 block w-full border-gray-300 rounded-md"
              rows={5}
              placeholder="Enter project description (max 2000 characters)"
            />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
