export default function NewTeamPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Create New Team</h1>
      <p className="text-gray-600">FR-010: Create Team</p>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Team Name</label>
            <input
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md"
              placeholder="Enter team name (1-50 characters)"
            />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Create Team
          </button>
        </div>
      </div>
    </div>
  );
}
