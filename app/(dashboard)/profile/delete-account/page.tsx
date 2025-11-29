export default function DeleteAccountPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Delete Account</h1>
      <p className="text-gray-600">FR-007: Account Deletion</p>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-4">
          <p className="text-red-800 font-semibold">Warning</p>
          <p className="text-red-700">This action cannot be undone. All your data will be permanently deleted.</p>
        </div>
        <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
          Delete Account
        </button>
      </div>
    </div>
  );
}
