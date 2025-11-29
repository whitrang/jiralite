export default function TeamInvitesPage({ params }: { params: { teamId: string } }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Team Invites</h1>
      <p className="text-gray-600">FR-013: Invite Member</p>
      <p className="text-sm text-gray-500">Team ID: {params.teamId}</p>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Invite New Member</h2>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter email address"
              className="flex-1 border-gray-300 rounded-md"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Send Invite
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Pending Invites</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">user@example.com</p>
                <p className="text-sm text-gray-600">Expires in 5 days</p>
              </div>
              <button className="text-red-600 hover:text-red-700">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
