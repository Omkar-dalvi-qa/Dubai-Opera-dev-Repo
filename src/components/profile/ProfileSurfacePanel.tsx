"use client";

export default function ProfileSurfacePanel({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-[10px] border border-[#2b2b2b] bg-[#1E1E1E] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:p-7 ${className}`}
    >
      {children}
    </section>
  );
}

