export default function TeamPage({ params }: { params: { teamId: string } }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Team Dashboard</h1>
      <p className="text-gray-600">FR-021: View Projects</p>
      <p className="text-sm text-gray-500">Team ID: {params.teamId}</p>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Projects</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            New Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Project Name</h3>
            <p className="text-gray-600 text-sm">10 issues</p>
          </div>
        </div>
      </div>
    </div>
  );
}
