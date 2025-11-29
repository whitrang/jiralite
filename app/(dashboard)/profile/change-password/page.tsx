export default function ChangePasswordPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Change Password</h1>
      <p className="text-gray-600">FR-006: Password Change</p>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input type="password" className="mt-1 block w-full border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input type="password" className="mt-1 block w-full border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input type="password" className="mt-1 block w-full border-gray-300 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
