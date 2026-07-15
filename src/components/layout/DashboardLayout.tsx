import Sidebar from "./Sidebar";
import NotificationBell from "@/components/NotificationBell";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: "COMPANY" | "AGENCY" | "ADMIN";
}

export default function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userType={userType} />
      <div className="flex-1 flex flex-col overflow-auto">
        <header className="flex items-center justify-end px-6 py-3 bg-white border-b border-gray-100 sticky top-0 z-40">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
