export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Personal Dashboard</h1>
      <p className="text-gray-600">FR-081: Personal Dashboard</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">My Assigned Issues</h3>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Due Soon</h3>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">My Teams</h3>
        </div>
      </div>
    </div>
  );
}
