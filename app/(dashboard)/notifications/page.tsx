export default function NotificationsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <button className="text-sm text-blue-600 hover:text-blue-700">
          Mark All as Read
        </button>
      </div>
      <p className="text-gray-600">FR-090: In-App Notification</p>
      <p className="text-gray-600">FR-091: Mark as Read</p>

      <div className="bg-white rounded-lg shadow mt-6">
        <div className="divide-y">
          <div className="p-4 bg-blue-50 hover:bg-blue-100 cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="font-medium">You were assigned to issue #42</p>
                <p className="text-sm text-gray-600">Project: Website Redesign</p>
                <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
              </div>
            </div>
          </div>

          <div className="p-4 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-transparent rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="font-medium text-gray-700">John Doe commented on issue #38</p>
                <p className="text-sm text-gray-600">Project: Mobile App</p>
                <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 hover:bg-yellow-100 cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="font-medium">Issue #25 is due tomorrow</p>
                <p className="text-sm text-gray-600">Project: API Development</p>
                <p className="text-xs text-gray-500 mt-1">1 day ago</p>
              </div>
            </div>
          </div>

          <div className="p-4 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-transparent rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="font-medium text-gray-700">You were promoted to ADMIN in Team Alpha</p>
                <p className="text-sm text-gray-600">Role changed by team owner</p>
                <p className="text-xs text-gray-500 mt-1">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
