import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: "COMPANY" | "AGENCY" | "ADMIN";
}

export default function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userType={userType} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
