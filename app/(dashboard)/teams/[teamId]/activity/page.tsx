export default function TeamActivityPage({ params }: { params: { teamId: string } }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Team Activity Log</h1>
      <p className="text-gray-600">FR-019: Team Activity Log</p>
      <p className="text-sm text-gray-500">Team ID: {params.teamId}</p>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="space-y-4">
          <div className="flex gap-4 border-b pb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="font-medium">John Doe joined the team</p>
              <p className="text-sm text-gray-600">2 hours ago</p>
            </div>
          </div>
          <div className="flex gap-4 border-b pb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="font-medium">New project "Website Redesign" created</p>
              <p className="text-sm text-gray-600">5 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
