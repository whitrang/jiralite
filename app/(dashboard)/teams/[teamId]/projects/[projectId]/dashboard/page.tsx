export default function ProjectDashboardPage({
  params,
}: {
  params: { teamId: string; projectId: string };
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Project Dashboard</h1>
      <p className="text-gray-600">FR-080: Project Dashboard</p>
      <p className="text-sm text-gray-500">Team: {params.teamId} | Project: {params.projectId}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Issue Count by Status</h3>
          <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
            Pie Chart Placeholder
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Completion Rate</h3>
          <div className="text-4xl font-bold text-blue-600">65%</div>
          <p className="text-sm text-gray-600">13 of 20 issues completed</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Issues by Priority</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>HIGH</span>
              <span className="font-semibold">5</span>
            </div>
            <div className="flex justify-between">
              <span>MEDIUM</span>
              <span className="font-semibold">10</span>
            </div>
            <div className="flex justify-between">
              <span>LOW</span>
              <span className="font-semibold">5</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow col-span-full">
          <h3 className="font-semibold mb-4">Recently Created Issues</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span>Issue #1: Fix login bug</span>
              <span className="text-sm text-gray-600">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
