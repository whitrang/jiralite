export default function InvitesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Team Invitations</h1>
      <p className="text-gray-600">Pending team invitations sent to your email</p>

      <div className="bg-white rounded-lg shadow mt-6">
        <div className="divide-y">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Team Alpha</h3>
                <p className="text-sm text-gray-600">Invited by John Doe</p>
                <p className="text-xs text-gray-500 mt-1">Expires in 5 days</p>
              </div>
              <div className="flex gap-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Accept
                </button>
                <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400">
                  Decline
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Design Team</h3>
                <p className="text-sm text-gray-600">Invited by Jane Smith</p>
                <p className="text-xs text-gray-500 mt-1">Expires in 2 days</p>
              </div>
              <div className="flex gap-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Accept
                </button>
                <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400">
                  Decline
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50">
            <div className="flex items-center justify-between opacity-60">
              <div>
                <h3 className="text-lg font-semibold">Backend Team</h3>
                <p className="text-sm text-gray-600">Invited by Bob Johnson</p>
                <p className="text-xs text-red-600 mt-1">Expired</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">No longer available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
