"use client";
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Card({ large, className, ...p }: HTMLAttributes<HTMLDivElement> & { large?: boolean }) {
  return <div {...p} className={cx("card p-6", large && "card-lg", className)} />;
}

export function Button({ variant = "primary", size, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost"; size?: "sm";
}) {
  return <button type="button" {...p} className={cx("btn", `btn-${variant}`, size === "sm" && "btn-sm", className)} />;
}

export type Tone = "primary" | "good" | "warn" | "bad" | "neutral";
const TONE: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-[#9A5B05]",
  bad: "bg-bad-soft text-[#B8352E]",
  neutral: "bg-bg-2 text-ink-soft",
};

export function Chip({ icon, children, tone = "neutral", className }: { icon?: ReactNode; children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={cx("chip", TONE[tone], className)}>{icon && <span aria-hidden className="inline-flex">{icon}</span>}{children}</span>;
}

/** Rounded square icon bubble used in cards and list rows. */
export function IconBubble({ children, tone = "primary", size = 44 }: { children: ReactNode; tone?: Tone; size?: number }) {
  return (
    <span aria-hidden className={cx("inline-flex shrink-0 items-center justify-center rounded-full", TONE[tone])} style={{ width: size, height: size }}>
      {children}
    </span>
  );
}

export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cx("input", className)} />;
}

export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cx("input", className)} />;
}

export function Segmented<T extends string | number>({ options, value, onChange, label }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string;
}) {
  return (
    <div role="group" aria-label={label} className="seg">
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

/** Selectable pill used in forms (multi or single choice). */
export function OptionPill({ selected, onClick, children, icon }: { selected: boolean; onClick: () => void; children: ReactNode; icon?: ReactNode }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick}
      className={cx("btn btn-sm border", selected ? "border-primary bg-primary-soft text-primary" : "border-[rgba(99,102,241,0.14)] bg-surface text-ink-soft hover:text-primary")}>
      {icon && <span aria-hidden className="inline-flex">{icon}</span>}
      {children}
    </button>
  );
}

export function StatCard({ icon, label, value, tone = "primary" }: { icon: ReactNode; label: string; value: ReactNode; tone?: Tone }) {
  const color = tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : tone === "neutral" ? "text-ink" : "text-primary";
  return (
    <div className="card p-5">
      <p className="flex items-center gap-2 text-sm font-medium text-ink-soft"><span aria-hidden className={color}>{icon}</span>{label}</p>
      <p className={cx("mt-2 text-3xl font-bold", color)}>{value}</p>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-gradient text-4xl md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-lg text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
