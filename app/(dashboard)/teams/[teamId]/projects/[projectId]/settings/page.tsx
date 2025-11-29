export default function ProjectSettingsPage({
  params,
}: {
  params: { teamId: string; projectId: string };
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Project Settings</h1>
      <p className="text-gray-600">FR-023: Update Project</p>
      <p className="text-gray-600">FR-024: Delete Project</p>
      <p className="text-gray-600">FR-026: Archive Project</p>
      <p className="text-sm text-gray-500">Team: {params.teamId} | Project: {params.projectId}</p>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Name</label>
            <input type="text" className="mt-1 block w-full border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea className="mt-1 block w-full border-gray-300 rounded-md" rows={5} />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Update Project
          </button>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8">
          <h3 className="text-lg font-semibold mb-4">Archive Project</h3>
          <p className="text-sm text-gray-600 mb-4">Archived projects are read-only and can be restored later.</p>
          <button className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700">
            Archive Project
          </button>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
          <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
            Delete Project
          </button>
        </div>
      </div>
    </div>
  );
}
