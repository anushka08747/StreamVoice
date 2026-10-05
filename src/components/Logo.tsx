import { AudioLines } from "lucide-react";

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <span aria-hidden className="inline-flex items-center justify-center rounded-full text-white"
      style={{ width: size, height: size, background: "linear-gradient(135deg, var(--primary-2), var(--primary))", boxShadow: "var(--shadow-btn)" }}>
      <AudioLines size={size * 0.48} strokeWidth={2.2} />
    </span>
  );
}
