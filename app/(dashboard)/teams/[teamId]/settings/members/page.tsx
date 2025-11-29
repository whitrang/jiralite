export default function TeamMembersPage({ params }: { params: { teamId: string } }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Team Members</h1>
      <p className="text-gray-600">FR-014: View Members</p>
      <p className="text-gray-600">FR-015: Kick Member</p>
      <p className="text-gray-600">FR-016: Leave Team</p>
      <p className="text-gray-600">FR-018: Change Role</p>
      <p className="text-sm text-gray-500">Team ID: {params.teamId}</p>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Name</th>
              <th className="text-left py-2">Email</th>
              <th className="text-left py-2">Role</th>
              <th className="text-left py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">John Doe</td>
              <td className="py-2">john@example.com</td>
              <td className="py-2">OWNER</td>
              <td className="py-2">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
