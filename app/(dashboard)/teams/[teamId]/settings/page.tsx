export default function TeamSettingsPage({ params }: { params: { teamId: string } }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Team Settings</h1>
      <p className="text-gray-600">FR-011: Update Team</p>
      <p className="text-gray-600">FR-012: Delete Team</p>
      <p className="text-sm text-gray-500">Team ID: {params.teamId}</p>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Team Name</label>
            <input type="text" className="mt-1 block w-full border-gray-300 rounded-md" />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Update Team
          </button>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
          <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
            Delete Team
          </button>
        </div>
      </div>
    </div>
  );
}
