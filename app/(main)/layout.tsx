'use client';

import { Sidebar } from '@/components/ui';
import { useUIStore } from '@/store/uiStore';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Arc-style Sidebar */}
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        className="flex-shrink-0"
      />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}