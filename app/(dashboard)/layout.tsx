import { LayoutGrid, MessageSquare, FileText, Users, Bell, Settings } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 gap-6">
        <button className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <LayoutGrid className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <MessageSquare className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <FileText className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Users className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mt-auto">
          <Bell className="w-5 h-5" />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
