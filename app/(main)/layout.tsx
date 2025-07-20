export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar will be added here later */}
      <div className="w-80 bg-purple-50 border-r border-purple-200">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-purple-900">Conversations</h2>
          <p className="text-sm text-purple-600 mt-2">Sidebar will be implemented here</p>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}