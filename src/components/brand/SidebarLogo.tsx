import { TRIcon } from "./TRIcon";

export function SidebarLogo() {
  return (
    <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
      <TRIcon size={36} />
      <div>
        <span className="type-wordmark text-white text-lg tracking-tight leading-none">
          talentradar
        </span>
        <div
          className="h-px mt-1 rounded-full"
          style={{ background: "linear-gradient(90deg, #00FFD1 0%, #7B61FF 100%)" }}
        />
      </div>
    </div>
  );
}
