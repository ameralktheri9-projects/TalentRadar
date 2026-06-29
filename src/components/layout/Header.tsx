"use client";

interface HeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
}

export default function Header({ title, subtitle, userName }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {userName && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
            {userName.charAt(0)}
          </div>
          <span className="text-sm text-gray-700">{userName}</span>
        </div>
      )}
    </header>
  );
}
